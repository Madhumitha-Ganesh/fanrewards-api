# FanRewards API

A REST API for a music fan rewards platform — users earn points by completing listening challenges and redeem them for rewards.

## Tech Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Fastify
- **ORM**: TypeORM + PostgreSQL
- **Auth**: JWT (access + refresh tokens)
- **Infrastructure**: Docker Compose

## Setup

### Prerequisites

- Node.js 18+
- Docker + Docker Compose

### Steps

```bash
# 1. Clone and install dependencies
git clone https://github.com/Madhumitha-Ganesh/fanrewards-api

npm install

# 2. Copy environment file
cp .env.example

# 3. Start PostgreSQL
docker compose up -d

# 4. Run migrations
npm run migration:generate src/migrations/Init
npm run migration:run

# 5. Seed the database
npm run seed

# 6. Start dev server 
npm run dev

# 7. Run tests
npm test
npm run test:coverage

```
Server runs on http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `belong` | Database user |
| `DB_PASSWORD` | `belong_dev` | Database password |
| `DB_DATABASE` | `fan_rewards` | Database name |
| `JWT_ACCESS_SECRET` | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | — | Secret for signing refresh tokens |

## API Overview

### Auth (public)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Users (authenticated)
```
GET   /api/users/me
PATCH /api/users/me
GET   /api/users/me/stats
```

### Challenges (authenticated)
```
GET  /api/challenges
GET  /api/challenges/:id
POST /api/challenges/:id/complete
```

### Rewards (authenticated)
```
GET  /api/rewards
POST /api/rewards/:id/redeem
GET  /api/rewards/history
```

### Leaderboard (authenticated)
```
GET /api/leaderboard
GET /api/leaderboard/me
```

### Health
```
GET /health
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run migration:generate <name>` | Generate a new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
