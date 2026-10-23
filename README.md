# C58

Website for C58 — a St Neots-based events company. Built with Next.js and Sanity CMS, deployed on Vercel. Includes first-party ticket sales (reservation, SumUp checkout, ticket issuing) backed by Supabase Postgres.

---

## Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19, TypeScript      |
| Styling     | Tailwind CSS v4, Motion                            |
| CMS         | Sanity Studio v5                                   |
| Data layer  | next-sanity, GROQ                                  |
| Database    | Supabase Postgres (`postgres` driver, raw SQL)     |
| Payments    | SumUp hosted checkout                              |
| Bot defence | Postgres-backed rate limit + Cloudflare Turnstile  |
| Validation  | Zod                                                |
| Testing     | Jest, Testing Library, Testcontainers              |
| Deployment  | Vercel (web), GitHub Actions (Studio)              |

---

## Project Structure

```
c58/
├── web/          # Next.js frontend + ticketing API (server actions, webhooks)
├── studio/       # Sanity Studio
├── supabase/     # Postgres migrations (Supabase CLI)
├── docs/         # Roadmaps, ADRs, architecture notes
└── plans/        # Animation improvement plans
```

**Sources of truth:** Sanity owns content and event config (tiers, prices, capacities). Postgres owns orders, tickets and live inventory. Tier capacity is mirrored from Sanity into the `tiers` table by a webhook — see [Sanity tiers webhook](#sanity-tiers-webhook).

---

## Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- npm
- Access to the Sanity project
- Access to the Supabase project (for ticketing)
- Docker (for the concurrency test in `npm test`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (only if applying migrations)

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Oggie112/C58.git
cd C58
```

### 2. Install dependencies

```bash
cd web && npm install
cd ../studio && npm install
```

### 3. Configure environment variables

Create `web/.env.local` with the following:

```env
# --- Site ---
# Absolute site URL — used for OG image URLs and to build SumUp's webhook URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# --- Sanity: project config (safe to expose) ---
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-02-07
NEXT_PUBLIC_SANITY_STUDIO_URL=https://c58.sanity.studio

# --- Sanity: tokens (keep secret) ---
# Draft Mode — viewer token for live preview
NEXT_PUBLIC_SANITY_VIEWER_TOKEN=your_viewer_token
# Server-side read token — used by Draft Mode and live queries
SANITY_API_READ_TOKEN=your_read_token
# Shared secret for the eventDetails → tiers sync webhook
SANITY_WEBHOOK_SECRET=your_webhook_secret

# --- Database (server-only) ---
# Supabase transaction-pooler connection string (port 6543)
DATABASE_POOLED_URL=postgresql://...

# --- SumUp (server-only) ---
SUMUP_API_KEY=your_sumup_api_key
SUMUP_MERCHANT_CODE=your_merchant_code

# --- Cloudflare Turnstile ---
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# --- Instagram feed (optional) ---
NEXT_PUBLIC_BEHOLD_FEED_ID=your_behold_feed_id
```

Where to get each value:

| Variable | Source |
| --- | --- |
| Sanity tokens | **sanity.io/manage → API → Tokens** — both `Viewer` permissions |
| `SANITY_WEBHOOK_SECRET` | Set by you when creating the webhook (see below) |
| `DATABASE_POOLED_URL` | Supabase dashboard → **Connect → Transaction pooler** |
| `SUMUP_API_KEY` | SumUp dashboard → **Developers → API keys**. Use the secret API key, **not** the "Public Key" shown alongside it |
| `SUMUP_MERCHANT_CODE` | SumUp dashboard → account / profile |
| Turnstile keys | Cloudflare dashboard → **Turnstile**. Add `localhost` to the widget's hostname allowlist for local dev |
| `NEXT_PUBLIC_BEHOLD_FEED_ID` | [behold.so](https://behold.so) feed settings |

> `DATABASE_POOLED_URL` is read at import time — any route touching the database fails to load without it.

`VERCEL_ENV` is set automatically by Vercel; `robots.ts` only allows indexing when it equals `production`.

### 4. Run locally

```bash
# Frontend — http://localhost:3000
cd web && npm run dev

# Sanity Studio — http://localhost:3333
cd studio && npm run dev
```

### 5. Studio environment files (optional)

The Studio's Presentation tool previews whatever `SANITY_STUDIO_PREVIEW_URL` points at, falling back to `http://localhost:3000`. The Studio loads env files by mode — `sanity dev` runs in _development_, `sanity build`/`sanity deploy` in _production_:

| File | `sanity dev` | `sanity build` / `deploy` |
| --- | --- | --- |
| `.env` | ✅ | ✅ |
| `.env.local` | ✅ | ✅ |
| `.env.development` | ✅ | ❌ |
| `.env.production` | ❌ | ✅ |

Recommended local setup (all `studio/.env*` files are gitignored):

```env
# studio/.env — shared default
SANITY_STUDIO_PREVIEW_URL=https://www.c58.uk

# studio/.env.development — local Presentation previews your local web/ dev server
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

> **Don't put `localhost` in `.env.local`.** Despite the name, it's loaded in every mode, so a manual `sanity deploy` from your machine would bake `localhost:3000` into the live Studio — editors' Presentation would then try to load their own machine. Deploys normally run in CI, which sets the production URL itself (see [GitHub Actions](#github-actions-secrets)).

---

## Ticketing

Purchase flow, end to end:

1. `/events/[slug]` renders tiers from Sanity; `TierPicker` fetches live availability from `/api/stock/[eventDetailsId]`.
2. The `createOrder` server action validates input, applies the rate limit (Turnstile challenge once exceeded), and atomically reserves stock in Postgres (`lib/reserveOrder.ts`).
3. A SumUp hosted checkout is created and the buyer is redirected to it.
4. SumUp calls `/api/webhooks/sumup`. The handler re-fetches the checkout status from SumUp, then marks the order paid and issues one ticket per admission.

Abandoned reservations are released lazily after 30 minutes — no cron job.

Prices are stored in **pounds** in Sanity and **pence** in Postgres; conversion happens once in `reserveOrder`.

### Sanity tiers webhook

Ticket tiers are only purchasable once their capacity has been synced to Postgres. Configure in **sanity.io/manage → API → Webhooks**:

- **URL:** `<NEXT_PUBLIC_SITE_URL>/api/webhooks/sanity-tiers`
- **Filter:** `_type == "eventDetails"` — published documents only (drafts excluded)
- **Triggers:** create, update, delete
- **Projection:** `{"eventDetailsId": _id, "tiers": tiers[]{_key, capacity}}`
- **Secret:** same value as `SANITY_WEBHOOK_SECRET`

If a tier shows as unavailable despite having capacity in Sanity, the webhook most likely hasn't fired for that document.

### Database migrations

Migrations live in `supabase/migrations/`. Apply with the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

RLS is enabled on every table with no policies — the app connects as the table owner, so this only blocks access via Supabase's Data API.

---

## Other Commands

```bash
cd web && npm run build      # Production build
cd web && npm run typecheck  # Generate route types, then tsc --noEmit
cd web && npm test           # Jest test suite (Docker must be running)
cd web && npm run lint       # ESLint
```

Route params are typed with Next's generated `PageProps` / `RouteContext` helpers, which live in `.next/types/`. Use `npm run typecheck` rather than a bare `tsc` — in a fresh checkout those types don't exist until `next typegen` (or `dev` / `build`) has run.

Jest runs two projects: `*.test.ts` under Node and `*.test.tsx` under jsdom. `lib/reserveOrder.concurrency.test.ts` spins up a throwaway Postgres container via Testcontainers.

---

## Deployment

The frontend deploys automatically to Vercel on push to `main`. No manual steps required.

**Required Vercel environment variables** — add every variable from `web/.env.local` to the Vercel project settings, with `NEXT_PUBLIC_SITE_URL` set to the deployed domain.

The Sanity Studio is deployed to [c58.sanity.studio](https://c58.sanity.studio) (redirects to its `sanity.io/@…` dashboard address, deep links included) by GitHub Actions on push to `main` when `studio/` changes.

The canonical site is **`https://www.c58.uk`** — `c58.uk` and `c58.vercel.app` both permanently redirect to it. Keep these in step with it:

| Where | Setting |
| --- | --- |
| Vercel (Production + Preview) | `NEXT_PUBLIC_SITE_URL=https://www.c58.uk` |
| `deploy-studio.yml` | `SANITY_STUDIO_PREVIEW_URL: https://www.c58.uk` (plain workflow env, not a secret) |
| sanity.io/manage → API → CORS origins | `https://www.c58.uk`, with credentials allowed — needed for live draft previews |

### GitHub Actions secrets

| Secret | Used by |
| --- | --- |
| `SANITY_AUTH_TOKEN` | `deploy-studio.yml` — Studio deploys |
| `DATABASE_POOLED_URL` | `supabase-keepalive.yml` — pings the database twice weekly so the free tier doesn't pause |

---

## Docs

- **CMS Guide** — accessible via the Guide tab inside Sanity Studio
- [`docs/roadmaps/mvp.md`](docs/roadmaps/mvp.md) — site roadmap
- [`docs/roadmaps/ticketing.md`](docs/roadmaps/ticketing.md) — ticketing roadmap and implementation notes
- [`docs/adrs/`](docs/adrs/) — architecture decision records
- [`docs/sale-architecture.md`](docs/sale-architecture.md) — ticket sales design sketch
