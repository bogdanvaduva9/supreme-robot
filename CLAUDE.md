# Atlas — Claude Code Project Context

## What Is This

**Atlas** is a living encyclopedia of every Romanian locality — 13,000+ villages, communes, cities, and municipalities. It provides a rich, community-maintained profile for each one: demographics, infrastructure, services, culture, nature, economy, and historical media (via the Arhivă feature). The product name is **Atlas**; the repo name is `supreme-robot`.

---

## Current Phase

**Phase 1 — The Skeleton** (data pipeline + seed import + locality pages)

- Launch județ: **Maramureș** (~100 communes, strong diaspora)
- Goal: auto-generate a baseline page for every Maramureș locality from open data sources
- Community features come in Phase 2; search intelligence in Phase 3; Arhivă in Phase 4

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (TypeScript), static export (`output: "export"`), S3 + CloudFront |
| API | API Gateway + Lambda (Python 3.12, `python3.12` runtime) |
| Primary DB | DynamoDB — single-table, SIRUTA as partition key |
| Search | OpenSearch — Romanian diacritics analyzers, geo queries |
| Media | S3 + CloudFront |
| Photo pipeline | Lambda + SQS + Step Functions |
| Auth | Cognito (Google + Facebook social login) |
| Scheduling | EventBridge (data refresh jobs) |
| IaC | AWS CDK (TypeScript) |
| CI/CD | GitHub Actions |
| Primary region | `eu-central-1` (Frankfurt); ACM certificates in `us-east-1` (CloudFront requirement) |
| Monitoring | CloudWatch + Lambda Powertools (Logger, Tracer, Metrics) + AWS X-Ray |

---

## Repository Layout

```
supreme-robot/
├── CLAUDE.md                  # ← you are here
├── docs/
│   ├── architecture.md        # DynamoDB design, CDK stacks, pipeline topology
│   ├── data-model.md          # Full Locality struct reference
│   └── data-sources.md        # Seed data sources (INS, OSM, Wikidata, etc.)
├── Makefile                   # build, test, deploy shortcuts
├── infrastructure/            # AWS CDK (TypeScript)
│   ├── bin/app.ts
│   ├── lib/
│   │   ├── stacks/            # One stack per concern (api, db, pipeline, frontend)
│   │   └── constructs/        # Reusable CDK constructs
│   └── package.json
├── backend/                   # Python — all Lambda functions
│   ├── src/
│   │   ├── api/               # API Gateway handlers (get_locality, search, list_by_judet)
│   │   ├── pipeline/          # Import Lambdas (import_ins, import_osm, import_wikidata…)
│   │   └── shared/            # Shared code: DDB client, models, OpenSearch client, utils
│   ├── tests/
│   └── pyproject.toml         # uv-managed; Ruff + mypy + pytest
└── frontend/                  # Next.js SPA (static export)
    ├── src/
    │   ├── app/               # App Router pages
    │   ├── components/
    │   └── lib/
    ├── next.config.ts         # output: "export", trailingSlash: true
    └── package.json
```

---

## Python Lambda Conventions

- **Runtime:** `python3.12`
- **Entry point:** each Lambda file in `backend/src/api/` or `backend/src/pipeline/` exports a `handler(event, context)` function — that's the Lambda handler
- **Shared code:** `backend/src/shared/` — imported as a Lambda layer or included in the deployment package
- **Observability:** [Lambda Powertools for Python](https://docs.powertools.aws.dev/lambda/python/latest/) on every Lambda:
  - `@logger.inject_lambda_context` — structured JSON logs, always include `siruta` and `correlation_id`
  - `@tracer.capture_lambda_handler` — X-Ray tracing
  - `@metrics.log_metrics` — CloudWatch EMF metrics
- **Linting/formatting:** Ruff (`ruff check` + `ruff format`)
- **Type checking:** mypy (strict mode)
- **Testing:** pytest + `moto` for mocking AWS services locally
- **Dependency management:** `uv` (fast, lockfile-based)
- **Packaging:** `make build` zips each handler + `shared/` into `dist/<name>.zip` for CDK to reference

---

## CDK Conventions

Follows the same two-stack pattern as the personal-website project (`personal-website/infra/`).

- **Language:** TypeScript (Node 20), npm
- **Two mandatory stacks (always present):**
  - `AtlasCertStack` — ACM certificate, deployed to `us-east-1` (CloudFront requirement)
  - `AtlasFrontendStack` — S3 bucket, CloudFront (OAC), Route53 A records, deployed to `eu-central-1`
- **Additional stacks for the backend:**
  - `AtlasStorageStack` — DynamoDB table, SSM params
  - `AtlasSearchStack` — OpenSearch domain
  - `AtlasApiStack` — API Gateway + Lambda functions
  - `AtlasPipelineStack` — Step Functions, SQS, import Lambdas
- **Stack naming:** `Atlas{Concern}Stack` (no env prefix — single prod environment for now)
- **Resource naming:** `atlas-{resource}` e.g. `atlas-localities-table`
- **No hardcoded account IDs** — `CDK_DEFAULT_ACCOUNT` from GitHub Actions secret
- **Runtime for all Lambdas:** `lambda.Runtime.PYTHON_3_12`
- **Domain:** placeholder — set `DOMAIN` constant in `infra/bin/app.ts` once bought; hosted zone must pre-exist in Route53 before first deploy
- **`crossRegionReferences: true`** on all stacks (required for cert→CloudFront cross-region reference)

**CloudFront pattern (same as personal-website):**
- Private S3 bucket, OAC (`SIGV4_NO_OVERRIDE`) — no OAI
- CloudFront Function for www→apex 301 redirect
- HTTP/2+3, TLS 1.2+, `PRICE_CLASS_100`
- Error responses: 403 + 404 → 200 `/index.html` (SPA routing)
- Stack outputs: `BucketName`, `DistributionId` (read by GitHub Actions)

---

## DynamoDB — Single-Table Design

Table name: `atlas-{env}-main`

| Entity | PK | SK |
|---|---|---|
| Locality | `LOC#{siruta}` | `#METADATA` |
| Locality history | `LOC#{siruta}` | `HISTORY#{timestamp}` |
| Contributor | `USER#{user_id}` | `#PROFILE` |
| Edit | `LOC#{siruta}` | `EDIT#{timestamp}` |
| Photo | `LOC#{siruta}` | `PHOTO#{photo_id}` |

GSIs — see `docs/architecture.md` for full definitions.

---

## Domain Vocabulary

| Term | Meaning |
|---|---|
| **SIRUTA** | Romania's official numeric locality identifier (assigned by INS) — used as the primary key for every locality |
| **Județ** | Romanian county (41 total + Bucharest municipality) |
| **Comună** | Commune — rural administrative unit, contains one or more sate |
| **Sat** | Village |
| **Oraș** | Town |
| **Municipiu** | Municipality (major city with special status) |
| **INS** | Institutul Național de Statistică — publishes population and demographic data |
| **OSM** | OpenStreetMap — geographic boundaries and POIs |
| **ANCOM** | Autoritatea Națională pentru Administrare și Reglementare în Comunicații — publishes mobile coverage maps |
| **Completeness score** | A 0-100% metric per locality showing how much of the data model has been populated |
| **Arhivă** | The historical layer: old photos, scanned documents, oral histories attached to each locality |

---

## Key Business Rules

- Every locality page exists from day one (seeded from open data), even if sparse
- Community edits always override automated data (automated data is the floor, not the ceiling)
- All edits are versioned — nothing is ever permanently deleted
- Anonymous users can browse everything; Cognito account required to contribute
- Completeness score drives contributor motivation — always keep it accurate

---

## Running Locally

```bash
# Frontend (Next.js)
cd frontend
npm install
npm run dev          # local dev server
npm run build        # static export → frontend/out/

# Backend (Python)
cd backend
uv sync              # install dependencies from lockfile
uv run pytest        # run tests (moto mocks AWS)
uv run ruff check .  # lint
uv run mypy src      # type check
make build           # zips each Lambda + shared/ into dist/

# Infrastructure (CDK)
cd infrastructure
npm install
npx cdk diff         # preview changes against deployed stacks
npx cdk deploy --all --require-approval never
```

**GitHub Actions secrets required** (same as personal-website):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

**Deploy flow** (GitHub Actions on push to `main`):
1. Build Next.js → `frontend/out/`
2. Build Python Lambdas → `dist/*.zip`
3. `cdk deploy --all` — provisions/updates all stacks
4. Query CloudFormation outputs for `BucketName` + `DistributionId`
5. `aws s3 sync frontend/out/_next/` → S3 with `cache-control: max-age=31536000, immutable`
6. `aws s3 sync frontend/out/` → S3 (excluding `_next/`) with `cache-control: max-age=0, must-revalidate`
7. `aws cloudfront create-invalidation --paths "/*"`

---

## Commit Style

Conventional commits:
- `feat: add locality GET endpoint`
- `fix: handle missing SIRUTA in OSM import`
- `chore: update CDK dependencies`
- `docs: add data-sources reference`

---

## Reference Docs

- `docs/architecture.md` — DynamoDB GSIs, OpenSearch mappings, CDK stack breakdown, S3 layout
- `docs/data-model.md` — Complete Locality Python dataclass with all fields
- `docs/data-sources.md` — INS, OSM, Wikidata, ANCOM, Sentinel-2 access details
