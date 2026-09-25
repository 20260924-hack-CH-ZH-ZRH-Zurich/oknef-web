# Oknef Web

Oknef's Bun, Next.js, TypeScript and WebRTC frontend provides the public landing page, authentication, an asset inventory, family and business planning, a generative assistant, and the pitch route `/deck/JO202609240900`.

## Setup

Install Bun 1.4.2. Copy `.env.example` to `.env`, set `OKNEF_BACKEND_URL` to the backend origin and `PUBLIC_ORIGIN` to the canonical browser origin, and install the locked dependencies:

```sh
bun install --frozen-lockfile
bun run build
bun run start
```

The application requires `PORT`, `HOSTNAME`, `NODE_ENV`, `PUBLIC_ORIGIN`, and `OKNEF_BACKEND_URL`. The browser uses same-origin API calls; no provider credentials belong in this repository. The backend owns authentication, session cookies, demo provisioning, and records. Its allowed-origin configuration must match `PUBLIC_ORIGIN` exactly. Page visits through an alias redirect to this configured origin; API writes from other origins are rejected. The demo button calls its isolated demo-session endpoint.

`bun run start` runs the custom Next server, including the authenticated WebSocket proxy. `next start` alone does not provide that WebSocket proxy. For development, use `bun run dev`.

## Validation

```sh
bun run typecheck
bun run lint
bun test
bun run build
```

Browser validation uses `QA_BASE_URL`, `QA_OUTPUT_DIR`, and optional `QA_CHROMIUM_PATH`:

```sh
bun scripts/browser-check.mjs
```

Protocol checks without a browser are `QA_BASE_URL=http://localhost:3180 python3 scripts/ws-check.py` and `QA_BASE_URL=http://localhost:3180 bun scripts/passkeys-protocol.mjs`. The latter uses a software P-256 authenticator and verifies registration, sign-in, replay, origin, RP binding, signature integrity and user-verification enforcement. It does not test browser prompts or physical biometrics.

Set `QA_LIVE_AI=1` to validate paid live chat and image calls. Screenshots and the machine-readable report are written to the configured output directory.

## Container

```sh
docker build -t oknef-web:dev .
docker compose up --build
```

`docker-compose.yml` is for local development only. Production runs in Azure Container Apps via Terraform. `IMAGE_TAG` and `WEB_PORT` configure the local image tag and published port. Every build uses this repository as its own context.

## Component development

Reusable presentation components live under `src/components/ui/`; workflows and data loading live under `src/features/`. Styling uses Tailwind v4 and the tokens in `src/styles/globals.css`. API responses are validated before rendering, and generated content is rendered as React text and bounded typed cards.

The interface offers English, German, Spanish, and French with a browser-local language preference. Light and dark appearance use CSS tokens. The offline worker stores only the public offline fallback and icon, never workspace records or API responses.
