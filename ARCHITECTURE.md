# Architecture

## Overview

FanRewards API is a straightforward REST API. The design prioritises simplicity and correctness over complexity — each layer has a clear responsibility and the code stays easy to follow.

## Structure

```
src/
├── config/       # Environment config, TypeORM data source
├── entities/     # TypeORM entities (database schema)
├── services/     # Business logic
├── routes/       # Request handling, validation, response shaping
├── middleware/   # JWT auth guard
├── plugins/      # Fastify plugins (DB connection)
└── types/        # Shared TypeScript types
```

## Key Decisions

### Fastify over Express

Fastify has built-in JSON Schema validation, better TypeScript support, and measurably faster throughput. The plugin system makes it easy to scope middleware to specific route groups.

### Service layer

Routes are kept thin — they validate input, call a service method, and shape the response. Business logic (points calculation, concurrency handling, pagination) lives entirely in services. This makes services independently testable without spinning up HTTP.

### TypeORM with migrations

`synchronize: false` is intentional. Auto-sync is convenient in development but dangerous — a typo in an entity could drop a column in production. Migrations give an explicit, reviewable record of every schema change.

### JWT auth

Two-token pattern: short-lived access tokens (15 min) for API requests, long-lived refresh tokens (7 days) to get new access tokens without re-login. The auth middleware extracts and verifies the access token on every protected request.

### Concurrent reward redemption

The redeem flow uses a pessimistic row-level lock (`SELECT ... FOR UPDATE`) inside a transaction. This prevents two simultaneous requests from both passing the points check and double-spending.

### Points calculation

Challenge completion awards full points at 80%+ listen duration. Below that, points scale proportionally (`floor(points * percentage / 100)`). This is enforced entirely in `ChallengeService.complete` — the route just passes through the `listenPercentage` from the client.

### Leaderboard ranking

Rank is calculated at query time rather than stored. For ties, users who joined earlier rank higher (`ORDER BY totalPoints DESC, createdAt ASC`). This avoids a background job while keeping results consistent.

### Rate limiting

Global 100 requests/minute limit applied at the app level via `@fastify/rate-limit`. Protects all endpoints without needing per-route config.

### Health check

`GET /health` runs a `SELECT 1` against the database and returns `db: connected` or `db: disconnected` with a 503 status. Useful for load balancers and uptime monitoring.

## Trade-offs

- **No refresh token storage** — current logout is a no-op. Tokens remain valid until expiry. A proper implementation would store refresh tokens in the DB and invalidate on logout/rotation.
- **Rank computed on demand** — fine at this scale, but a high-traffic leaderboard would benefit from a cached or pre-computed rank table.
- **No request correlation IDs** — logs don't have trace IDs linking related log lines across a request lifecycle.
