# Atlas — Architecture Reference

## CDK Stack Breakdown

Entry point: `infrastructure/bin/app.ts` | Domain constant: `romania-atlas.com`

| Stack | Region | Resources | Phase |
|---|---|---|---|
| `AtlasCertStack` | `us-east-1` | ACM certificate (apex + www) | 1 |
| `AtlasFrontendStack` | `eu-central-1` | S3 bucket (SPA), CloudFront (OAC), Route53 A records | 1 |
| `AtlasStorageStack` | `eu-central-1` | DynamoDB table, SSM param | 1 |
| `AtlasApiStack` | `eu-central-1` | API Gateway, 3 Lambda handlers | 1 |
| `AtlasPipelineStack` | `eu-central-1` | Step Functions, SQS DLQs, 5 import Lambdas, EventBridge | 1 |
| `AtlasAuthStack` | `eu-central-1` | Cognito User Pool + app clients | **Phase 2** |
| `AtlasSearchStack` | `eu-central-1` | OpenSearch domain, Romanian analyzer | **Phase 3** |

All stack files: `infrastructure/lib/stacks/`.

### AtlasFrontendStack — CloudFront Setup

- **S3 bucket:** private, `BlockPublicAccess.BLOCK_ALL`
- **OAC:** `S3OriginAccessControl` with `SIGV4_NO_OVERRIDE`
- **CloudFront Function:** www → apex 301 redirect (JS 2.0 runtime)
- **Distribution:** HTTPS-only, HTTP/2+3, `PRICE_CLASS_100`, TLS 1.2+
- **Error responses:** 403 + 404 → 200 `/index.html` (SPA routing)
- **Outputs:** `BucketName`, `DistributionId` (consumed by GitHub Actions)

### AtlasStorageStack — DynamoDB

- Table: `atlas-prod-main`, `PAY_PER_REQUEST`, `pointInTimeRecovery: true`, `RemovalPolicy.RETAIN`
- SSM param: `/atlas/prod/dynamodb/table-name`
- **No S3 buckets in Phase 1** — media/satellite/imports buckets added in Phase 3

### AtlasApiStack — API Gateway + Lambda

3 public read-only Lambda functions, no auth:

| Lambda module | Route | Description |
|---|---|---|
| `api_get_locality` | `GET /localities/{siruta}` | Full locality record from DynamoDB |
| `api_list_by_judet` | `GET /localities?judet=MM` | List localities in a județ via GSI-1 |
| `api_list_judete` | `GET /judete` | List all județe with stats |

CORS: all origins, GET + OPTIONS only.

### AtlasPipelineStack — Import Pipeline

5 import Lambdas, each with an SQS DLQ (14-day retention):

| Lambda module | Source | Data written |
|---|---|---|
| `pipeline_fetch_siruta_list` | INS | List of SIRUTA codes for Maramureș → Step Functions input |
| `pipeline_import_ins` | INS CSV | Population, demographics |
| `pipeline_import_osm` | OSM Overpass API | Boundary GeoJSON, POIs |
| `pipeline_import_wikidata` | Wikidata SPARQL | Description, coordinates, alt names |
| `pipeline_import_ancom` | ANCOM | Mobile coverage data |

**State machine:** `atlas-prod-locality-importer`

```
FetchSirutaList
    │
    └─► Map: ForEachLocality (concurrency=10)
              │
              ├─► ImportINSData
              ├─► ImportOSMData
              ├─► ImportWikidata
              └─► ImportANCOM
```

EventBridge schedules:
- Full refresh: 1st of every month at 02:00 UTC
- Partial refresh: every Monday at 03:00 UTC

> `GenerateThumbnail` and `UpdateSearchIndex` steps removed — deferred to Phase 3.

---

## DynamoDB — Single-Table Design

**Table name:** `atlas-prod-main` | **Billing:** PAY_PER_REQUEST

**Primary Key:** `PK` (string) + `SK` (string)

### Entity Access Patterns

| Entity | PK | SK |
|---|---|---|
| Locality | `LOC#{siruta}` | `#METADATA` |
| Locality history | `LOC#{siruta}` | `HISTORY#{iso8601}` |
| Edit | `LOC#{siruta}` | `EDIT#{iso8601}#{user_id}` |
| Photo | `LOC#{siruta}` | `PHOTO#{photo_id}` |
| Contributor | `USER#{cognito_sub}` | `#PROFILE` |

### GSI Definitions

**GSI-1: `judet-completeness-index`**
- Purpose: list localities in a județ ordered by completeness score
- PK: `JudetCode` (e.g. `MM`), SK: `CompletenessScore` (zero-padded string)
- Projected: `name`, `type`, `population`, `lastUpdated`

**GSI-2: `updated-index`**
- Purpose: "recently updated localities" feed
- PK: `EntityType` (constant `LOC`), SK: `LastUpdated` (ISO8601)
- Projection: KEYS_ONLY

> **GSI `geohash-index`** removed from Phase 1 — geographic queries deferred to Phase 3 (OpenSearch geo_point).

---

## OpenSearch — Deferred to Phase 3

When added, the index will be `atlas-localities` with a Romanian diacritics analyzer (ă→a, â→a, î→i, ș→s, ț→t) to allow queries like "Budesti" to match "Budești".

---

## Data Import Pipeline — Phase 1

Lambdas fetch directly from external APIs (no S3 staging). Each Lambda:
- Reads from external source (INS, OSM Overpass, Wikidata SPARQL, ANCOM)
- Writes/merges into DynamoDB `atlas-prod-main`
- Failed executions land in per-Lambda SQS DLQ for manual review

---

## Lambda Build & Deployment

Each handler is zipped with `backend/src/shared/` into `dist/<module>.zip` via `make build`. CDK references each zip via `lambda.Code.fromAsset('../dist/<module>.zip')`.

```makefile
make build   # produces dist/*.zip
make test    # pytest
make lint    # ruff check
make check   # lint + typecheck (mypy)
```

---

## CI/CD — GitHub Actions

### `ci.yml` (on PR)
- Backend: `ruff check` + `mypy src` + `pytest`
- Infrastructure: `cdk synth` (dummy account `000000000000`)
- Frontend: `npm run build`

### `deploy.yml` (on push to `main`)
1. `make build` → `dist/*.zip`
2. `npm run build` → `frontend/out/`
3. `cdk deploy --all --outputs-file cdk-outputs.json`
4. Read `BucketName` + `DistributionId` from CDK outputs
5. `aws s3 sync _next/` → `cache-control: max-age=31536000, immutable`
6. `aws s3 sync` remaining → `cache-control: max-age=0, must-revalidate`
7. `aws cloudfront create-invalidation --paths "/*"`

**Required secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, `NEXT_PUBLIC_API_URL`

---

## Monitoring

- **Structured logging:** Lambda Powertools `Logger` — always include `siruta` and `correlation_id`
- **Tracing:** X-Ray active tracing on all Lambdas and API Gateway
- **DLQ alarms:** CloudWatch alarm when any pipeline DLQ has messages (Phase 1 only monitoring)
