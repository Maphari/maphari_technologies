# AI Service (`@maphari/ai`)

Tenant-aware AI orchestration surface for prompt generation workflows.

## Responsibilities

- Validate and process AI generation requests.
- Enforce tenant scope from gateway RBAC headers.
- Emit service health and metrics for observability.

## Routes

- `GET /health`
- `GET /metrics`
- `POST /ai/generate`
- `POST /ai/lead-qualify`
- `POST /ai/proposal-draft`
- `POST /ai/estimate`
- `GET /ai/jobs`

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `ai_jobs_total`
- `ai_job_latency_ms`

## Run

```bash
cp services/ai/.env.example services/ai/.env
pnpm --filter @maphari/ai dev
```
