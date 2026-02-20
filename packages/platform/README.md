# Platform Package (`@maphari/platform`)

Shared infrastructure adapters for runtime services.

## Includes

- `RedisCache`: JSON cache helpers with safe-connect behavior.
- `NatsEventBus`: publish/subscribe wrapper for domain events.
- Event topics constants under `EventTopics`.
- `ServiceMetrics`: Prometheus renderer with counter/histogram/gauge support.
- `registerServiceRateLimit`: in-memory service rate-limit hook helper.
- `signWebhookPayload` / `verifyWebhookSignature`: webhook signature helpers.
- `EnvSecretProvider` / `VaultHttpSecretProvider` / `ChainedSecretProvider`: runtime secret-loading abstraction.

## Usage

Import from service code:

```ts
import { RedisCache, NatsEventBus, EventTopics, ServiceMetrics } from "@maphari/platform";
```
