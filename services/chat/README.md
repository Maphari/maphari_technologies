# Chat Service (`@maphari/chat`)

Chat domain service for client conversations and messages.

## Current Routes

- `GET /health`
- `GET /metrics`
- `GET /conversations`
- `POST /conversations`
- `GET /conversations/:conversationId/messages`
- `POST /messages`

## Realtime Channel

- Socket.IO endpoint: `/socket.io`
- Room strategy: `tenant:<clientId>:conversation:<conversationId>`
- Events:
  - `conversation:join`
  - `message:send`
  - `message:created`

## Behavior

- `CLIENT` role is tenant-scoped by `x-client-id`.
- Message writes verify conversation ownership for tenant safety.
- Read paths use Redis cache; writes invalidate cache.
- Emits domain events to NATS on conversation/message creation.
- Realtime metrics include:
  - `chat_socket_connections_active`
  - `chat_socket_connections_current`
  - `chat_messages_emitted_total`
  - `chat_message_emit_latency_ms`
  - `db_query_duration_ms`

## Security Controls

- Service-level rate limits are enabled via:
  - `SERVICE_RATE_LIMIT_PUBLIC_MAX`
  - `SERVICE_RATE_LIMIT_PROTECTED_MAX`
  - `SERVICE_RATE_LIMIT_WINDOW_MS`

## Run

```bash
cp services/chat/.env.example services/chat/.env
pnpm --filter @maphari/chat prisma:generate
pnpm --filter @maphari/chat prisma:deploy
pnpm --filter @maphari/chat dev
```
