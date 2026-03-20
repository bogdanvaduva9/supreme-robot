# Atlas — Architecture Reference

## CDK Stack Breakdown

Follows the same pattern as `personal-website/infra/` — two mandatory stacks for the frontend (certificate cross-region split), plus additional stacks for the backend.

Entry point: `infrastructure/bin/app.ts`

```typescript
const DOMAIN = 'atlas.ro'; // placeholder until domain is purchased

const certStack = new AtlasCertStack(app, 'AtlasCertStack', {
  env: { account: ACCOUNT, region: 'us-east-1' }, // CloudFront cert requirement
  domainName: DOMAIN,
  crossRegionReferences: true,
});

new AtlasFrontendStack(app, 'AtlasFrontendStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
  domainName: DOMAIN,
  certificate: certStack.certificate,
  crossRegionReferences: true,
});

new AtlasStorageStack(app, 'AtlasStorageStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
});
// ... etc
```

| Stack | Region | Resources |
|---|---|---|
| `AtlasCertStack` | `us-east-1` | ACM certificate (apex + www) |
| `AtlasFrontendStack` | `eu-central-1` | S3 bucket (SPA), CloudFront (OAC), Route53 A records |
| `AtlasStorageStack` | `eu-central-1` | DynamoDB table, S3 media/satellite/imports buckets, SSM params |
| `AtlasSearchStack` | `eu-central-1` | OpenSearch domain |
| `AtlasApiStack` | `eu-central-1` | API Gateway, Lambda functions (API handlers) |
| `AtlasPipelineStack` | `eu-central-1` | Step Functions, SQS queues, EventBridge rules, import Lambdas |
| `AtlasAuthStack` | `eu-central-1` | Cognito User Pool, Identity Pool, app clients |

All stack files live in `infrastructure/lib/stacks/`.

### AtlasFrontendStack — CloudFront Setup

Exact same pattern as `personal-website/infra/lib/portfolio-stack.ts`:
- **S3 bucket:** private, `BlockPublicAccess.BLOCK_ALL`
- **OAC:** `S3OriginAccessControl` with `SIGV4_NO_OVERRIDE` (replaces deprecated OAI)
- **CloudFront Function:** www → apex 301 redirect (JS 2.0 runtime)
- **Distribution:** HTTPS-only, HTTP/2+3, `PRICE_CLASS_100`, TLS 1.2+
- **Error responses:** 403 + 404 → 200 `/index.html` (SPA client-side routing)
- **Outputs:** `BucketName`, `DistributionId` (consumed by GitHub Actions for sync + invalidation)

---

## DynamoDB — Single-Table Design

**Table name:** `atlas-{env}-main`

**Primary Key:** `PK` (string) + `SK` (string)

### Entity Access Patterns

#### Locality (core data)
- `PK = LOC#{siruta}` / `SK = #METADATA` — main locality record
- `PK = LOC#{siruta}` / `SK = HISTORY#{iso8601}` — historical data snapshots
- `PK = LOC#{siruta}` / `SK = EDIT#{iso8601}#{user_id}` — edit history
- `PK = LOC#{siruta}` / `SK = PHOTO#{photo_id}` — attached photos

#### User / Contributor
- `PK = USER#{cognito_sub}` / `SK = #PROFILE` — user profile
- `PK = USER#{cognito_sub}` / `SK = CONTRIB#{siruta}` — contribution record per locality

### GSI Definitions

**GSI-1: `judet-completeness-index`**
- Purpose: List all localities in a județ, ordered by completeness score
- PK: `JudetCode` (e.g. `MM` for Maramureș)
- SK: `CompletenessScore` (numeric, stored as zero-padded string for range queries)
- Projected attributes: `name`, `type`, `population`, `lastUpdated`

**GSI-2: `geohash-index`**
- Purpose: Geographic bounding box queries ("localities within X km of point")
- PK: `Geohash5` (first 5 chars of geohash — ~5km precision)
- SK: `PK` (the locality's full PK, for deduplication)
- Projected attributes: `name`, `coordinates`, `type`

**GSI-3: `updated-index`**
- Purpose: "Most recently updated localities" feed
- PK: `EntityType` (constant `LOC` for locality records)
- SK: `LastUpdated` (ISO8601 for natural sort)

---

## OpenSearch — Index Design

**Index name:** `atlas-{env}-localities`

### Key Mappings

```json
{
  "mappings": {
    "properties": {
      "siruta":       { "type": "keyword" },
      "name":         { "type": "text", "analyzer": "romanian_standard" },
      "name_keyword": { "type": "keyword" },
      "judet":        { "type": "keyword" },
      "type":         { "type": "keyword" },
      "population":   { "type": "integer" },
      "coordinates":  { "type": "geo_point" },
      "geohash":      { "type": "geo_shape" },
      "completeness": { "type": "float" },
      "summary":      { "type": "text", "analyzer": "romanian_standard" },
      "tags":         { "type": "keyword" },
      "last_updated": { "type": "date" }
    }
  }
}
```

### Romanian Analyzer

```json
{
  "analysis": {
    "char_filter": {
      "romanian_diacritics": {
        "type": "mapping",
        "mappings": [
          "ă => a", "â => a", "î => i", "ș => s", "ț => t",
          "Ă => A", "Â => A", "Î => I", "Ș => S", "Ț => T"
        ]
      }
    },
    "analyzer": {
      "romanian_standard": {
        "tokenizer": "standard",
        "char_filter": ["romanian_diacritics"],
        "filter": ["lowercase", "asciifolding"]
      }
    }
  }
}
```

This allows queries like "Budesti" to match "Budești" and vice versa.

---

## Data Import Pipeline (Phase 1)

### Step Functions State Machine: `atlas-{env}-locality-importer`

```
Start
  │
  ├─► FetchSirutaList         (Lambda: lists all Maramureș SIRUTA codes from INS)
  │
  ├─► Map: ForEachLocality
  │     │
  │     ├─► ImportINSData     (population, demographics)
  │     ├─► ImportOSMData     (boundary GeoJSON, POIs)
  │     ├─► ImportWikidata    (description, coordinates, alt names)
  │     ├─► ImportANCOM       (mobile coverage)
  │     └─► GenerateThumbnail (Sentinel-2 satellite image → S3)
  │
  └─► UpdateSearchIndex       (bulk upsert into OpenSearch)
```

- Map concurrency: 10 (stay within API rate limits)
- Each Lambda has a DLQ; failed items are retried up to 3 times then written to `atlas-{env}-import-failures` S3 bucket
- EventBridge rule triggers a full refresh monthly; partial refresh (changed localities only) weekly

---

## S3 Bucket Layout

| Bucket | Contents |
|---|---|
| `atlas-{env}-media` | User-uploaded photos (original), processed thumbnails |
| `atlas-{env}-satellite` | Sentinel-2 thumbnails per locality (`{siruta}.jpg`) |
| `atlas-{env}-imports` | Raw downloaded files from INS, OSM, ANCOM (for debugging/replay) |
| `atlas-{env}-import-failures` | Failed import records (JSON) for manual review |
| `atlas-{env}-frontend` | React SPA build artifacts |

All media buckets are private. CloudFront distributions serve content via OAC (Origin Access Control).

---

## API Design (Phase 1)

Base path: `https://api.atlas.ro/v1`

| Method | Path | Lambda | Description |
|---|---|---|---|
| GET | `/localities/{siruta}` | `api-get-locality` | Full locality record |
| GET | `/localities` | `api-list-by-judet` | List by județ, paginated |
| GET | `/search` | `api-search` | Full-text + geo search via OpenSearch |
| GET | `/judete` | `api-list-judete` | List all judete with stats |

Authentication: Cognito JWT in `Authorization` header. All read endpoints are public. Write endpoints require auth (Phase 2).

---

## Lambda Build & Deployment

Each handler module in `backend/src/api/` and `backend/src/pipeline/` is zipped together with `backend/src/shared/` into a deployment package. The shared code is co-packaged rather than a separate layer to keep cold starts simple.

```makefile
# Makefile (root)
HANDLERS := $(shell ls backend/src/api backend/src/pipeline)

build:
	@rm -rf dist && mkdir -p dist
	@for name in $(HANDLERS); do \
	  mkdir -p dist/$$name && \
	  cp -r backend/src/shared dist/$$name/ && \
	  find backend/src -name "$$name.py" -exec cp {} dist/$$name/ \; && \
	  cd dist/$$name && zip -r ../$$name.zip . && cd -; \
	done

test:
	cd backend && uv run pytest

lint:
	cd backend && uv run ruff check . && uv run mypy src
```

CDK references `dist/<name>.zip` via `lambda.Code.fromAsset("dist/<name>.zip")` when defining each `lambda.Function` with `runtime: lambda.Runtime.PYTHON_3_12`.

---

## Monitoring

- **Structured logging:** Lambda Powertools `Logger` with `@logger.inject_lambda_context`, always include `siruta` and `correlation_id`
- **Tracing:** X-Ray active tracing on all Lambdas and API Gateway stages
- **Alarms:** CloudWatch alarms on Lambda error rate > 1%, p99 latency > 2s, DLQ message count > 0
- **Dashboard:** CloudWatch dashboard per environment showing import pipeline health, API latency, search query rates
