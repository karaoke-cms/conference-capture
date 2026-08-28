# Metaphorum Conference Capture — Split-Service Design

## Objective

Build a reliable, mobile-first conference sensemaking system in which anonymous participants submit photos and observations to a session, while organizers generate traceable syntheses at session, track, and conference scope plus three or four World Café questions.

## Architecture

The system is a Bun workspace with three independently deployable applications and shared packages:

- `apps/web`: Nuxt 4 and Vue 3 frontend. It serves participant session pages and an organizer dashboard, but owns no persistence logic.
- `apps/api`: a TypeScript HTTP API responsible for validation, conference data, anonymous contributions, upload orchestration, synthesis records, and organizer commands.
- `apps/worker`: a TypeScript worker that polls durable jobs, processes contributions through an AI provider, and generates scheduled or manual syntheses.
- `packages/contracts`: Zod schemas and shared API/domain types.
- `packages/database`: PostgreSQL-compatible schema, repositories, migrations, and a SQLite development adapter.
- `packages/storage`: object-storage interface with local filesystem and S3-compatible implementations.
- `packages/ai`: image-analysis, embedding, sentiment, synthesis, and question-generation interfaces with deterministic mock implementations.
- `packages/domain`: scope resolution, aggregation, job scheduling, synthesis provenance, and question-selection rules.

The default local setup uses SQLite, local file storage, and deterministic mock AI. PostgreSQL and S3-compatible storage are enabled entirely through environment configuration.

## Data Model

`Conference` contains ordered `Track` records, and each track contains ordered `Session` records. A `Session` has a public slug used in URLs and QR codes.

Each `Contribution` records its session ID, creation time, optional caption, contribution type, participant-selected signal, stored media metadata, processing status, AI description, tags, inferred sentiment, and optional embedding. Participation is anonymous; no account or identity record is required.

Each `Synthesis` has a scope type (`session`, `track`, or `conference`), scope ID, generation time, summary, themes, tensions, sentiment distribution, weak signals, and explicit source contribution IDs. World Café output is stored as a conference-scoped synthesis with three or four questions and the same provenance.

`ProcessingJob` is the durable queue. It records job type, target scope, schedule time, attempts, status, and errors. This allows the API and worker to be deployed separately without relying on process memory.

## Participant Flow

An organizer distributes `/session/:slug` as a link or QR code. The page loads conference, track, and session context, then offers a camera/file input, optional caption, contribution type, and sentiment/signal selector. Submission uses a multipart API request. The API validates the payload, stores the image through the configured storage adapter, creates the contribution and an AI-processing job in one application-level transaction, and responds immediately. The worker enriches it asynchronously.

The interface is optimized for phones, accessible without login, resilient to missing AI credentials, and explicit about upload failures. Buttons and form controls follow karaoke5's touch-target and reduced-motion conventions.

## Organizer Flow

The organizer dashboard presents conferences, tracks, sessions, recent contributions, processing state, and the latest synthesis at every scope. It visualizes themes, tensions, weak signals, and sentiment distributions without implying false precision.

Manual controls enqueue session, track, conference, or World Café jobs. A protected scheduler endpoint enqueues jobs whose configured trigger time has arrived. The independently running worker claims jobs safely, runs the appropriate aggregation, writes the result, and retains every contributing source ID.

World Café generation asks the AI abstraction for candidate questions grounded in unresolved tensions, blind spots, convergence, and action. Domain rules then select three or four distinct final questions. The deterministic fallback produces useful grounded output from tags, signals, captions, and existing syntheses.

## API and Security Boundaries

Public endpoints allow reading session context and creating contributions. Organizer reads and mutations require a configured bearer token for the MVP. Uploads enforce MIME type and size limits, generate server-side object keys, and never trust client paths. Scheduled triggers use a separate cron secret. API errors use a consistent typed shape.

The API owns database writes. The worker accesses database repositories and provider abstractions directly, but does not expose HTTP routes. Storage URLs are returned through the storage abstraction so local and S3 modes have the same contract.

## Failure Handling

Contribution creation remains successful if AI is unavailable because enrichment is asynchronous. Failed jobs retain an error and retry count and can be retried from the dashboard. Synthesis jobs can complete through the deterministic provider when no external provider is configured. Missing photos do not prevent text-only contributions. Empty scopes produce an explicit insufficient-material synthesis rather than fabricated findings.

## Testing

Domain behavior and provider fallbacks are developed test-first with Bun's test runner. Repository contracts are tested against the local adapter. API tests exercise validation, anonymous contribution submission, organizer authorization, and synthesis job creation. Frontend utilities and view-state transformations are kept pure and tested in the karaoke5 style. Final verification includes tests, type checking, production builds for all applications, and an end-to-end smoke flow against the local stack.

## Deliberate MVP Limits

The MVP does not include participant accounts, real-time websockets, moderation workflows, editing contributions, direct Nostr publication, or production identity management. Adapter boundaries keep later integrations possible without making them conference-day dependencies.
