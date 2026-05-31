# Kill Live

A multi-user audio/video chat application built with Next.js + LiveKit. Supports screen sharing, room passwords, chat messages, and file uploads.

## Tech Stack

| Category  | Technology                            |
| --------- | ------------------------------------- |
| Framework | Next.js 16 (App Router)               |
| Language  | TypeScript                            |
| A/V       | LiveKit                               |
| Database  | PostgreSQL + Drizzle ORM              |
| Testing   | Vitest + Testing Library + Playwright |
| Runtime   | Bun                                   |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes (rooms, messages, livekit, auth...)
│   ├── profile/            # User profile page
│   └── room/[id]/          # Room page
├── components/             # React components
│   └── ui/                 # shadcn/ui base components
├── db/                     # Database schema & connection
├── lib/                    # Utilities, auth config, Zod schemas
├── queries/                # React Query hooks (data fetching & mutations)
├── services/               # Business logic (room-service, user-service)
└── test/                   # Test utilities & setup
drizzle/                    # Drizzle ORM migration files
playwright/                 # E2E tests
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- PostgreSQL >= 13
- [LiveKit Server](https://livekit.io) instance (local or hosted)

### Installation

```bash
bun install
cp .env.example .env
```

Edit `.env` with your actual configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/killlive"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_URL="ws://localhost:7880"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Initialize Database

```bash
bun run db:push
```

### Start Dev Server

```bash
bun run dev # http://localhost:3000
```

## Deployment

One-click deploy with Docker Compose (includes App, PostgreSQL, LiveKit):

```bash
cp .env.example .env                                    # Edit with actual config
cp docker/example.livekit.yaml docker/livekit.yaml      # Customize LiveKit config if needed
docker compose -f docker/docker-compose.yml up -d --build
```

Initialize the database (run from project root, requires `DATABASE_URL`):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kill-live" bun run db:push
```

Default app port is **3009**, configurable via `APP_PORT` in `.env`.

## Development

```bash
bun run dev            # Start dev server
bun run build          # Production build
bun run start          # Start production server
bun run lint           # Biome lint check
bun run lint:fix       # Biome auto-fix
bun run format         # Biome format
bun run typecheck      # TypeScript type check
bun run db:generate    # Generate DB migration
bun run db:push        # Push schema to database
bun run db:studio      # Open Drizzle Studio
```

## Testing

Uses Vitest + Testing Library + Playwright. Test files are colocated next to source code in `__tests__/` directories.

```bash
bun run test           # Run all unit tests
bun run test:coverage  # Generate coverage report
```

### E2E Tests

Uses Playwright:

```bash
bun run test:e2e:install  # Install browser (first time)
bun run test:e2e          # Run E2E tests
bun run test:e2e:ui       # Playwright UI mode
```

### CI

GitHub Actions runs lint -> typecheck -> unit tests -> build automatically. See `.github/workflows/*.yml`.

## License

MIT
