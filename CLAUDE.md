# Atlas — Claude Code Project Context

## What Is This

**Atlas** is a living encyclopedia of every Romanian locality — 13,000+ villages, communes, cities, and municipalities. It provides a rich, community-maintained profile for each one: demographics, infrastructure, services, culture, nature, economy, and historical media (via the Arhivă feature). The product name is **Atlas**; the repo name is `supreme-robot`.

---

## Current Phase

**Phase 1 — POC / The Skeleton** (data pipeline + seed import + locality pages)

- Launch județ: **Maramureș** (~100 communes, strong diaspora)
- Goal: auto-generate a baseline page for every Maramureș locality from open data sources
- Community features come in Phase 2; search intelligence in Phase 3; Arhivă in Phase 4

---

## Tech Stack

| Layer | Technology | Phase |
|---|---|---|
| Frontend | Next.js (TypeScript), static export (`output: "export"`), S3 + CloudFront | 1 |
| API | API Gateway + Lambda (Python 3.12) | 1 |
| Primary DB | DynamoDB — single-table, on-demand billing | 1 |
| IaC | AWS CDK (TypeScript) | 1 |
| CI/CD | GitHub Actions | 1 |
| Scheduling | EventBridge (data refresh jobs) | 1 |
| Auth | Cognito (Google + Facebook social login) | **Phase 2** |
| Search | OpenSearch — Romanian diacritics analyzers, geo queries | **Phase 3** |
| Media | S3 + CloudFront | **Phase 3** |
| Monitoring | CloudWatch + Lambda Powertools (Logger, Tracer, Metrics) + AWS X-Ray | 1 |

---

## Repository Layout

```
supreme-robot/
├── CLAUDE.md                  # ← you are here
├── docs/
│   ├── architecture.md        # CDK stacks, DynamoDB design, pipeline topology
│   ├── data-model.md          # Full Locality struct reference
│   └── data-sources.md        # Seed data sources (INS, OSM, Wikidata, etc.)
├── Makefile                   # build, test, deploy shortcuts
├── .github/
│   └── workflows/
│       ├── ci.yml             # PR checks: lint, typecheck, test, cdk synth, frontend build
│       └── deploy.yml         # Push to main: build → cdk deploy → S3 sync → CF invalidate
├── infrastructure/            # AWS CDK (TypeScript)
│   ├── bin/app.ts
│   ├── lib/stacks/            # One file per stack
│   └── package.json
├── backend/                   # Python — all Lambda functions
│   ├── src/
│   │   ├── api/               # API Gateway handlers
│   │   ├── pipeline/          # Import Lambdas
│   │   └── shared/            # Shared code: DDB client, models, utils
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

## Active CDK Stacks (Phase 1)

| Stack | Region | Resources |
|---|---|---|
| `AtlasCertStack` | `us-east-1` | ACM certificate (apex + www) |
| `AtlasFrontendStack` | `eu-central-1` | S3 bucket, CloudFront (OAC), Route53 A records |
| `AtlasStorageStack` | `eu-central-1` | DynamoDB table (`atlas-prod-main`), SSM param |
| `AtlasApiStack` | `eu-central-1` | API Gateway (`atlas-api`), 3 Lambda functions |
| `AtlasPipelineStack` | `eu-central-1` | Step Functions, SQS DLQs, 5 import Lambdas, EventBridge rules |

> `AtlasAuthStack` and `AtlasSearchStack` are deferred to Phase 2/3.

---

## API Endpoints (Phase 1)

Base URL: `https://romania-atlas.com` (API Gateway URL in `NEXT_PUBLIC_API_URL` secret)

| Method | Path | Lambda | Description |
|---|---|---|---|
| GET | `/localities` | `api_list_by_judet` | List localities in a județ (`?judet=MM`) |
| GET | `/localities/{siruta}` | `api_get_locality` | Full locality record |
| GET | `/judete` | `api_list_judete` | List all județe with stats |

All endpoints are public (read-only). Auth required in Phase 2.

---

## Python Lambda Conventions

- **Runtime:** `python3.12`
- **Entry point:** `handler(event, context)` in each file under `backend/src/api/` or `backend/src/pipeline/`
- **Shared code:** `backend/src/shared/` — co-packaged into each zip (no layer)
- **Observability:** Lambda Powertools on every Lambda:
  - `@logger.inject_lambda_context` — structured JSON logs, always include `siruta` and `correlation_id`
  - `@tracer.capture_lambda_handler` — X-Ray tracing
  - `@metrics.log_metrics` — CloudWatch EMF metrics
- **Linting/formatting:** Ruff (`ruff check` + `ruff format`)
- **Type checking:** mypy (strict mode)
- **Testing:** pytest + `moto` for mocking AWS services locally
- **Dependency management:** `uv` (lockfile-based)
- **Packaging:** `make build` zips each handler + `shared/` into `dist/<name>.zip`

---

## CDK Conventions

- **Language:** TypeScript (Node 20), npm
- **Domain:** `romania-atlas.com` — `DOMAIN` constant in `infrastructure/bin/app.ts`; hosted zone must pre-exist in Route53
- **No hardcoded account IDs** — `CDK_DEFAULT_ACCOUNT` from GitHub Actions secret
- **Runtime for all Lambdas:** `lambda.Runtime.PYTHON_3_12`
- **`crossRegionReferences: true`** on all stacks (cert→CloudFront cross-region reference)
- **Stack naming:** `Atlas{Concern}Stack`
- **Resource naming:** `atlas-prod-{resource}`

**CloudFront pattern:**
- Private S3 bucket, OAC (`SIGV4_NO_OVERRIDE`)
- CloudFront Function for www→apex 301 redirect (JS 2.0)
- HTTP/2+3, TLS 1.2+, `PRICE_CLASS_100`
- Error responses: 403 + 404 → 200 `/index.html` (SPA routing)
- Outputs: `BucketName`, `DistributionId`

---

## DynamoDB — Single-Table Design

Table name: `atlas-prod-main` | Billing: PAY_PER_REQUEST

| Entity | PK | SK |
|---|---|---|
| Locality | `LOC#{siruta}` | `#METADATA` |
| Locality history | `LOC#{siruta}` | `HISTORY#{timestamp}` |
| Edit | `LOC#{siruta}` | `EDIT#{timestamp}` |
| Photo | `LOC#{siruta}` | `PHOTO#{photo_id}` |
| Contributor | `USER#{user_id}` | `#PROFILE` |

**GSI-1 `judet-completeness-index`:** PK=`JudetCode`, SK=`CompletenessScore` — list localities in a județ by completeness
**GSI-2 `updated-index`:** PK=`EntityType`, SK=`LastUpdated` — recently updated feed

> GSI for geo queries (`geohash-index`) deferred until OpenSearch is added in Phase 3.

---

## CI/CD (GitHub Actions)

**`ci.yml`** — on PR to `main`:
- Backend: `ruff check`, `mypy src`, `pytest`
- Infrastructure: `cdk synth` (dummy account `000000000000`)
- Frontend: `npm run build`

**`deploy.yml`** — on push to `main`:
1. `make build` → `dist/*.zip`
2. `npm run build` (Next.js) → `frontend/out/`
3. `cdk deploy --all --outputs-file cdk-outputs.json`
4. `aws s3 sync _next/` with `max-age=31536000, immutable`
5. `aws s3 sync` remaining files with `max-age=0, must-revalidate`
6. `aws cloudfront create-invalidation --paths "/*"`

**Secrets required:**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
- `NEXT_PUBLIC_API_URL` (API Gateway URL — available after first deploy)

---

## Domain Vocabulary

| Term | Meaning |
|---|---|
| **SIRUTA** | Romania's official numeric locality identifier (INS) — primary key for every locality |
| **Județ** | Romanian county (41 total + Bucharest municipality) |
| **Comună** | Commune — rural administrative unit, contains one or more sate |
| **Sat** | Village |
| **Oraș** | Town |
| **Municipiu** | Municipality (major city with special status) |
| **INS** | Institutul Național de Statistică — population and demographic data |
| **OSM** | OpenStreetMap — geographic boundaries and POIs |
| **ANCOM** | Autoritatea Națională pentru Administrare și Reglementare în Comunicații — mobile coverage maps |
| **Completeness score** | A 0-100% metric per locality showing how much of the data model has been populated |
| **Arhivă** | Historical layer: old photos, scanned documents, oral histories (Phase 4) |

---

## Key Business Rules

- Every locality page exists from day one (seeded from open data), even if sparse
- Community edits always override automated data (automated data is the floor, not the ceiling)
- All edits are versioned — nothing is ever permanently deleted
- Anonymous users can browse everything; Cognito account required to contribute (Phase 2)
- Completeness score drives contributor motivation — always keep it accurate

---

## Running Locally

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && uv sync && uv run pytest

# CDK (dry-run)
cd infrastructure && npm install && npx cdk diff
```

---

## Commit Style

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

---

## Doc Maintenance Rule

**After any session where stacks, workflows, endpoints, or data model change — update `CLAUDE.md` and `docs/architecture.md` to reflect current state.** Keeping these accurate reduces context/token usage in future sessions.

---

## Reference Docs

- `docs/architecture.md` — detailed CDK stack breakdown, DynamoDB GSIs, pipeline topology
- `docs/data-model.md` — complete Locality Python dataclass with all fields
- `docs/data-sources.md` — INS, OSM, Wikidata, ANCOM access details
