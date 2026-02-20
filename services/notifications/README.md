# Notifications Service (`@maphari/notifications`)

Channel orchestration service for email, SMS, and push workflows.

## Responsibilities

- Enqueue trigger-based notification jobs.
- Process jobs with retry strategy and delivery status tracking.
- Validate provider callbacks with signatures and callback rate limits.
- Subscribe to domain events for trigger-based notifications.

## Routes

- `GET /health`
- `GET /metrics`
- `POST /notifications/jobs`
- `POST /notifications/process`
- `GET /notifications/jobs`
- `POST /notifications/provider-callback`

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `notification_jobs_total`
- `notification_job_retries_total`
- `notification_callback_invalid_total`

## Run

```bash
cp services/notifications/.env.example services/notifications/.env
pnpm --filter @maphari/notifications dev
```

## Current Event Subscriptions

- `core.lead.created`
- `chat.message.created`
- `billing.invoice.overdue`
