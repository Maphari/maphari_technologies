# Public API Onboarding (Phase 7)

## 1) Issue a Partner API Key

Use a staff/admin JWT via gateway:

```bash
curl -X POST http://localhost:4000/api/v1/public-api/keys \
  -H 'authorization: Bearer <staff-or-admin-jwt>' \
  -H 'content-type: application/json' \
  -d '{"clientId":"550e8400-e29b-41d4-a716-446655440551","label":"Partner Integration"}'
```

Response returns `keyId` and `keySecret`.

## 2) Sign Partner Request Body

Compute `sha256` HMAC over raw JSON body using `keySecret`, then send:

- `x-api-key-id: <keyId>`
- `x-api-signature: <hex hmac signature>`

## 3) Create Partner Project

```bash
curl -X POST http://localhost:4000/api/v1/public-api/projects \
  -H 'x-api-key-id: <keyId>' \
  -H 'x-api-signature: <signature>' \
  -H 'content-type: application/json' \
  -d '{"name":"External Project","description":"Created from partner integration"}'
```

## 4) List Partner Projects

```bash
curl http://localhost:4000/api/v1/public-api/projects \
  -H 'x-api-key-id: <keyId>' \
  -H 'x-api-signature: <signature-for-empty-json-body>'
```

## Security Notes

- Rotate keys on a fixed interval and immediately after incident response.
- Keep `keySecret` server-side only.
- Reject unsigned requests and monitor auth-failure metrics.
