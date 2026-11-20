# Incident Copilot Dashboard

An incident operations workspace that combines a searchable incident queue, service impact context, incident timelines, runbook retrieval and an AI-assisted investigation workflow.

## What is included

- Incident command dashboard with severity filters, search and incident detail views.
- Structured AI investigation: situation summary, root-cause hypotheses, confidence estimate, prioritized actions, evidence and missing information.
- OpenAI-compatible chat completions integration, with a deterministic rules-based fallback when no provider key is configured.
- Service-specific runbook content and related incident context.
- Incident status API contract and health endpoint.
- PostgreSQL/Prisma schema, seed data, Docker Compose database and container build.
- Explicit demo-mode labels: seeded records are sample data; status updates are not persisted in demo mode.

## Quick start

Requirements: Node.js 20.10+, npm, and Docker (for PostgreSQL).

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

The dashboard runs with sample data and rules-based analysis without an AI key. To enable model-backed analysis, set `OPENAI_API_KEY`, and optionally `OPENAI_BASE_URL` and `OPENAI_MODEL`, in `.env`. The key is only read by server-side code and is never sent to the browser.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `OPENAI_API_KEY` | Optional provider key; omit to use deterministic fallback |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible API base URL |
| `OPENAI_MODEL` | Model identifier, default `gpt-4o-mini` |
| `OPENAI_TIMEOUT_MS` | Provider request timeout, default 30000 ms |

## API

- `GET /api/health` - service health and configuration flags.
- `GET /api/incidents` - seeded incident list.
- `POST /api/incidents/:id/analyze` - generate an incident analysis.
- `PATCH /api/incidents/:id/status` - validates a requested status change. Demo mode explicitly returns `persisted: false`.

## Architecture

- Next.js App Router and React UI.
- Server-side analysis orchestration in `lib/analysis.ts`.
- Deterministic fallback to keep local demos useful without external model access.
- Prisma data model in `prisma/schema.prisma` for incidents, events, analyses and knowledge articles.
- PostgreSQL via Docker Compose for the persistence layer.

## Important production hardening

This repository is an MVP, not a production-ready incident management system. Before connecting live systems or exposing it publicly:

1. Implement authentication and role-based authorization; configure the optional deployment-level access control supported by your hosting platform.
2. Replace demo API data with Prisma-backed queries and persist status changes, events and analysis snapshots.
3. Add tenant isolation, audit logging, rate limits, request validation and secret management.
4. Add provider-specific output schema validation, prompt-injection defenses for ingested ticket/runbook content, and evaluation datasets.
5. Add real observability integrations and verify all proposed actions with an authorized human. The copilot does not execute remediation.
6. Configure TLS, secure headers, backups, retention policies and operational alerts.

## Docker

Build the application image with:

```bash
docker build -t incident-copilot .
```

The container expects a reachable PostgreSQL database and the environment variables documented above. Run Prisma migrations before starting the service. The included Dockerfile uses Next.js standalone output; enable `output: "standalone"` in `next.config.mjs` before using the image build as-is.

## License

MIT
