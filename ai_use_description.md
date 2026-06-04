# AI Use Description

## Tools Used

- **Chatgpt** used throughout the implementation

## How It Was Used

### Scaffolding and boilerplate
Used Chatgpt to generate the initial structure for services and routes once the patterns were established. For example, after writing `ChallengeService` manually, Chatgpt  helped scaffold `RewardService` and `LeaderboardService` in the same style.

### Debugging
Hit a PostgreSQL authentication error early on — a native `postgres.exe` Windows service was running on port 5432 alongside Docker, intercepting connections. Used Chatgpt  to diagnose by checking which processes were bound to the port and identify the conflict.

### Documentation
Used Chatgpt  to draft `README.md` and `ARCHITECTURE.md` as a starting point, then revised the content and trade-offs section to reflect actual decisions made during implementation.

## What I Did Myself

- Designed the entity relationships and column types
- Decided on pessimistic locking for concurrent redemption
- Chose the points calculation formula (proportional below 80%)
- Reviewed and adjusted all generated code before committing
- Made final calls on architecture trade-offs (no refresh token storage, rank on demand vs cached)

## Honest Assessment

AI was a useful accelerator for repetitive structure and catching gaps, but every piece of generated code was read, understood, and often adjusted before use. The design decisions and trade-offs were made independently.
