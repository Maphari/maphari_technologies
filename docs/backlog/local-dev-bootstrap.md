# Local Bootstrap (Foundation + Data/Auth Slice)

Prerequisite: Docker Desktop (or Docker Engine with Compose) must be installed and running.

## 1. Install dependencies

```bash
pnpm install
```

## 2. Start local infrastructure

```bash
pnpm infra:up
```

## 3. Configure service environments

```bash
cp services/auth/.env.example services/auth/.env
cp services/core/.env.example services/core/.env
cp services/chat/.env.example services/chat/.env
cp services/files/.env.example services/files/.env
cp services/billing/.env.example services/billing/.env
cp services/automation/.env.example services/automation/.env
cp services/ai/.env.example services/ai/.env
cp services/analytics/.env.example services/analytics/.env
cp services/notifications/.env.example services/notifications/.env
cp services/public-api/.env.example services/public-api/.env
cp apps/gateway/.env.example apps/gateway/.env
cp apps/web/.env.example apps/web/.env.local
```

Set the same `JWT_ACCESS_SECRET` value in both:

- `services/auth/.env`
- `apps/gateway/.env`

## 4. Run Prisma setup per service

```bash
pnpm db:generate
pnpm db:migrate
```

## 5. Start services

Open separate terminals:

```bash
pnpm dev:auth
pnpm dev:core
pnpm dev:chat
pnpm dev:files
pnpm dev:billing
pnpm dev:automation
pnpm dev:ai
pnpm dev:analytics
pnpm dev:notifications
pnpm dev:public-api
pnpm dev:gateway
pnpm dev:web
```

## 6. Smoke tests

- `GET http://localhost:4000/api/v1/health`
- `GET http://localhost:4000/api/v1/metrics`
- `POST http://localhost:4000/api/v1/auth/login` with JSON body `{"email":"client@example.com"}`
- `POST http://localhost:4000/api/v1/auth/refresh` with cookie `maphari_refresh_token=<value>` or JSON body `{"refreshToken":"<token>"}`.
- `GET http://localhost:4000/api/v1/clients` with headers:
  - `x-user-id: user_1`
  - `x-user-role: CLIENT`
  - `x-client-id: <client_uuid>`
- `POST http://localhost:4000/api/v1/conversations` with headers above and JSON body:
  - `{"clientId":"<client_uuid>","subject":"Kickoff"}`
- `PATCH http://localhost:4000/api/v1/leads/<lead_uuid>/status` with headers above and JSON body:
  - `{"status":"QUALIFIED"}`
- `POST http://localhost:4000/api/v1/files` with headers above and JSON body:
  - `{"clientId":"<client_uuid>","fileName":"brief.pdf","storageKey":"uploads/brief.pdf","mimeType":"application/pdf","sizeBytes":1024}`
- `POST http://localhost:4000/api/v1/files/upload-url` with headers above and JSON body:
  - `{"fileName":"brief.pdf","mimeType":"application/pdf","sizeBytes":1024}`
- `PUT <uploadUrl-from-previous-step>` with raw file bytes and header:
  - `content-type: application/pdf`
- `POST http://localhost:4000/api/v1/files/confirm-upload` with headers above and JSON body:
  - `{"fileName":"brief.pdf","storageKey":"<storageKey>","mimeType":"application/pdf","sizeBytes":1024,"uploadToken":"<uploadToken>"}`
- `POST http://localhost:4000/api/v1/invoices` with headers above and JSON body:
  - `{"clientId":"<client_uuid>","number":"INV-001","amountCents":19900,"status":"ISSUED"}`
- `POST http://localhost:4000/api/v1/ai/generate` with headers above and JSON body:
  - `{"prompt":"Generate onboarding plan"}`
- `POST http://localhost:4000/api/v1/analytics/events` with headers above and JSON body:
  - `{"eventName":"portal.login","category":"auth"}`
- `POST http://localhost:4000/api/v1/notifications/jobs` with headers above and JSON body:
  - `{"channel":"EMAIL","recipient":"ops@example.com","message":"Deployment complete"}`
- `POST http://localhost:4000/api/v1/public-api/keys` with admin JWT and JSON body:
  - `{"clientId":"<client_uuid>","label":"Partner A"}`
