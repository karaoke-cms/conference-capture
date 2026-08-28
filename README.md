# Metaphorum Conference Capture

A mobile-first conference sensemaking system for Metaphorum 2026. Participants open a session-specific URL or QR code, contribute a photo and/or short observation without creating an account, and select the kind of contribution and how it landed. A separate worker enriches contributions and produces traceable syntheses at session, track, and conference scope, followed by three or four grounded World Café questions.

## What is included

- Nuxt 4 and Vue 3 participant interface, following the framework and conventions used by karaoke5
- Organizer dashboard with contributions, themes, tensions, weak signals, sentiment, provenance, and QR codes
- Separate Hono API service
- Separate durable-job worker
- Conference → track → session → contribution data model
- Timestamped anonymous contributions tied to session IDs
- Local and private AWS S3 object-storage adapters
- Deterministic AI fallback that requires no credentials
- Optional OpenAI-compatible analysis and synthesis provider
- Manual and scheduled session, track, conference, and World Café jobs
- SQLite local persistence with WAL for API/worker concurrency
- PostgreSQL-compatible initial migration and PostgreSQL client boundary
- Seed data and an end-to-end smoke test

## Architecture

```text
Participant phone             Organizer
      │                           │
      └──────── Nuxt web ─────────┘
                    │
                 Hono API
                  │    │
                  │    └── local files or private AWS S3
                  │
          SQLite repository (local)
          PostgreSQL schema boundary
                  │
             durable jobs
                  │
          independent worker
                  │
       mock AI or configured provider
                  │
   contribution → session → track → conference
                  │
        3–4 World Café questions
```

The API owns participant and organizer HTTP requests. The worker claims persisted jobs and can run as a long-lived process or in one-shot mode. AI failure never blocks contribution capture. Every synthesis stores the exact contribution IDs from which it was derived.

## Prerequisites

- Bun 1.3.14 or compatible
- Optional: Docker with Compose
- Optional: an AWS S3 bucket
- Optional: AI-provider credentials

## Local setup

```bash
cp .env.example .env
bun install
bun run seed
```

Start all three services in one attached terminal:

```bash
bun run dev
```

The command restarts any development services from an earlier managed run and combines their logs. Press Ctrl+C to stop all three, or stop them from another terminal with:

```bash
bun run stop
```

For troubleshooting, the services can still be started separately:

```bash
bun run dev:api
bun run dev:worker
bun run dev:web
```

Open:

- Public session directory: http://localhost:3000/sessions
- Participant example: http://localhost:3000/session/opensoma-a-decolonial-cybernetic-agent-talk1
- Organizer dashboard: http://localhost:3000/organizer
- API health: http://localhost:8787/health

In the organizer dashboard, select sessions under **Session QR codes**, choose alphabetical, time, or track sorting, and use **Print selected** to open an A4 PDF in a new tab. Track sorting adds divider pages when the selection spans multiple tracks.

The sample organizer token is the value of `ORGANIZER_TOKEN` in `.env`. Change both organizer and cron secrets before exposing the application to a network.

The default local setup uses:

```env
DATABASE_URL=sqlite://.data/conference.db
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=.data/uploads
AI_PROVIDER=mock
```

No external credentials are required.

## Useful commands

```bash
bun test                 # all automated and smoke tests
bun run typecheck        # strict checks across every package/service
bun run build            # production builds
bun run dev              # restart API, worker, and web; show combined logs
bun run stop             # stop all managed development services
bun run seed             # idempotently add sample conference data
bun run import:metaphorum # import the current Metaphorum programme
bun run worker:once      # process one queued job
bun run scheduler        # invoke one protected scheduling tick
```

### Import the Metaphorum programme

```bash
bun run import:metaphorum
# Or import from another checkout:
bun run import:metaphorum --source /path/to/metaphorum
```

The default source is `/Users/mathis/dev/metaphorum/metaphorum`. The import is idempotent: conferences, tracks, and sessions use namespaced source IDs and stable session slugs, so running it again updates existing records instead of creating duplicates. Talks without a matching schedule entry remain explicitly unscheduled and appear as “Schedule to be confirmed”. The two original demo sessions are removed only when they have no participant contributions.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Local SQLite database URL | `sqlite://.data/conference.db` |
| `STORAGE_DRIVER` | `local` or `s3` | `local` |
| `STORAGE_LOCAL_DIR` | Local uploaded-image directory | `.data/uploads` |
| `PUBLIC_MEDIA_BASE_URL` | API URL for local images | `http://localhost:8787/media` |
| `ORGANIZER_TOKEN` | Bearer token for organizer endpoints | required outside local development |
| `CRON_SECRET` | Bearer token for scheduler endpoint | required outside local development |
| `WEB_ORIGIN` | Allowed browser origin | `http://localhost:3000` |
| `API_BASE_URL` | API URL used by Nuxt and scheduler | `http://localhost:8787` |
| `API_PORT` | API listening port | `8787` |
| `MAX_UPLOAD_BYTES` | Maximum image size | `10000000` |
| `AI_PROVIDER` | `mock` or `openai` | `mock` |
| `OPENAI_API_KEY` | Optional provider credential | unset |
| `OPENAI_MODEL` | Optional model override | `gpt-5-mini` |

## AWS S3 configuration

The S3 adapter keeps the bucket private, writes objects with standard S3 server-side encryption, and gives organizers presigned viewing URLs valid for 30 minutes. It uses the AWS default credential chain, so production workloads can use an IAM role without permanent keys.

```env
STORAGE_DRIVER=s3
S3_REGION=eu-central-1
S3_BUCKET=metaphorum-contributions
S3_PREFIX=metaphorum-2026/contributions
S3_FORCE_PATH_STYLE=false
```

For local development only, credentials may be placed in the untracked `.env`:

```env
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

The AWS SDK also recognizes standard AWS profiles and workload roles. Do not commit credentials.

Minimal bucket-object policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::metaphorum-contributions/*"
  }]
}
```

Block public access on the bucket. Browser-to-S3 CORS is unnecessary because uploads pass through the API.

## Persistence

Local development uses Bun's SQLite driver. WAL mode and a five-second busy timeout allow the API and worker to share the database safely for an MVP.

The canonical schema is in `packages/database/migrations/0000_initial.sql`. It uses types and constraints accepted by PostgreSQL, and `packages/database/src/postgres.ts` provides the production PostgreSQL client boundary. The current runnable repository is the SQLite adapter; wiring the same repository contract to a managed PostgreSQL deployment is intentionally isolated to the database package and does not affect API, worker, or UI contracts.

## AI processing and fallback

With `AI_PROVIDER=mock`, the worker deterministically:

- describes text or marks image-only contributions for interpretation
- extracts tags
- retains participant-selected sentiment
- creates a small deterministic embedding
- synthesizes themes, tensions, weak signals, and sentiment counts
- generates four distinct World Café perspectives

With `AI_PROVIDER=openai` and `OPENAI_API_KEY` configured, the provider uses external analysis and falls back to deterministic processing if a request fails. Empty scopes return an explicit “not enough material” result and never fabricate findings.

## Synthesis triggers

Organizers can enqueue every synthesis from the dashboard. The protected scheduler endpoint is:

```text
POST /api/scheduler/tick
Authorization: Bearer <CRON_SECRET>
```

The included scheduler command invokes it once. Run it from cron, EventBridge Scheduler, Kubernetes CronJob, or another scheduler:

```bash
bun run scheduler
```

Session synthesis becomes due ten minutes after a session ends. Conference synthesis and World Café generation become due one hour before the conference ends. Manual triggers remain available throughout.

## Docker

```bash
cp .env.example .env
docker compose build
docker compose run --rm api bun scripts/seed.ts
docker compose up
```

The API and worker share a named volume for the local SQLite database and uploaded files. For AWS S3, set `STORAGE_DRIVER=s3` and supply the S3 variables through the deployment environment.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/session/:slug` | public | Participant capture page |
| `/organizer` | organizer token | Sensemaking dashboard and QR codes |
| `GET /api/sessions/:slug` | public | Session context |
| `POST /api/contributions` | public | Anonymous text/photo contribution |
| `GET /api/organizer/dashboard` | bearer token | Organizer data |
| `POST /api/organizer/synthesis` | bearer token | Manual synthesis or questions |
| `POST /api/scheduler/tick` | cron bearer token | Scheduled job creation |

## Deliberate MVP boundaries

The MVP does not add participant accounts, participant tracking, real-time websockets, moderation workflows, or Nostr publication. The interfaces for persistence, storage, and AI are separate packages so these capabilities can evolve without changing the participant flow.
