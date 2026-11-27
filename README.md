# Incident Copilot Dashboard

An incident operations workspace that combines a searchable incident queue, service impact context, incident timelines, runbook retrieval and an AI-assisted investigation workflow.

## MVP features

- Incident queue with severity filters and search.
- Incident details, activity timeline, impact context and status request controls.
- Structured investigation summary, root-cause hypotheses, confidence estimate, prioritized actions, evidence and missing information.
- OpenAI-compatible chat completions integration with a deterministic fallback when no provider key is configured.
- Service-specific runbook guidance and related incident context.
- Health, incident list, analysis and status API endpoints.
- Clearly labelled sample data and demo-mode status changes. No production systems are connected and status changes are not persisted.

## Local setup

Requirements: Node.js 20 and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. The app works without an AI key using rules-based analysis. To enable model-backed analysis, set `OPENAI_API_KEY` and optionally `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_TIMEOUT_MS` in `.env`. The API key is read by server-side code only.

## Scripts

- `npm run dev` - local development server
- `npm run build` - production build
- `npm start` - production server
- `npm run typecheck` - TypeScript validation
- `npm test` - Vitest suite
- `npm run lint` - Next.js ESLint

## API

- `GET /api/health` - health/configuration flags
- `GET /api/incidents` - sample incident list
- `POST /api/incidents/:id/analyze` - analyze a sample incident
- `PATCH /api/incidents/:id/status` - validate a demo status request; returns `persisted: false`

## Scope and production readiness

This is a demonstration MVP. It uses in-memory sample incidents and runbook data, not a live incident source or database. Authentication/RBAC, persistence, tenant isolation, audit logging, rate limiting, provider-output validation, prompt-injection defenses, live observability integrations, deployment secrets, backups and alerting must be implemented and reviewed before production use. The copilot only recommends actions; it does not execute remediation.

## License

MIT
