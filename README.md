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
# Shared secret for the publish → site revalidation webhook (a different value)
SANITY_REVALIDATE_SECRET=your_revalidate_secret

# --- Database (server-only) ---
# Supabase transaction-pooler connection string (port 6543)
DATABASE_POOLED_URL=postgresql://...

# --- SumUp (server-only) ---
SUMUP_API_KEY=your_sumup_api_key
SUMUP_MERCHANT_CODE=your_merchant_code

# --- Brevo: order confirmation emails (server-only) ---
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=tickets@c58.uk
BREVO_SENDER_NAME=C58
BREVO_LIST_ID=3
# Optional locally; required in production — without it, replies go to the
# sender address, which has no mailbox, and bounce
BREVO_REPLY_TO_EMAIL=your_reply_to_address

# --- Scheduled jobs (server-only) ---
# Shared secret for the hourly confirmation-retry endpoint; must match the
# CRON_SECRET GitHub Actions secret
CRON_SECRET=your_cron_secret

# --- Feature switches (optional) ---
# Marketing opt-in: off unless exactly "true" (checkbox hidden, nothing synced
# to Brevo). Leave unset until the privacy policy covers marketing.
# MARKETING_OPT_IN_ENABLED=true

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
| `SANITY_WEBHOOK_SECRET` | Set by you when creating the tiers webhook (see [below](#sanity-tiers-webhook)) |
| `SANITY_REVALIDATE_SECRET` | Set by you when creating the revalidate webhook (see [below](#sanity-revalidate-webhook)) — use a different value from `SANITY_WEBHOOK_SECRET` so each can be rotated independently |
| `DATABASE_POOLED_URL` | Supabase dashboard → **Connect → Transaction pooler** |
| `SUMUP_API_KEY` | SumUp dashboard → **Developers → API keys**. Use the secret API key, **not** the "Public Key" shown alongside it |
| `SUMUP_MERCHANT_CODE` | SumUp dashboard → account / profile |
| `BREVO_API_KEY` | Brevo → **SMTP & API → API keys**. Restricted access: transactional email send, contacts read/write, account read. Shown once — copy it straight into env vars. Keep Brevo's unknown-IP blocking **off** (Vercel's outbound IPs aren't fixed) |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | An active sender on the authenticated `c58.uk` domain (Brevo → **Senders, Domains & Dedicated IPs**) |
| `BREVO_LIST_ID` | Brevo → **Contacts → Lists** — the marketing opt-in list's numeric ID. The consent attributes the sync writes (`OPT_IN_SOURCE`, `OPT_IN_DATE`, `OPT_IN_WORDING`, `OPT_IN_ORDER`, `LAST_EVENT`) must exist under **Contacts → Settings → Contact attributes → Normal** — Brevo silently drops values for attributes it doesn't have |
| `BREVO_REPLY_TO_EMAIL` | The business inbox buyers' replies should reach |
| `MARKETING_OPT_IN_ENABLED` | Optional. Leave **unset** until the privacy policy covers marketing email (see [`docs/compliance-inventory.md`](docs/compliance-inventory.md), C6). Setting it to `true` in Vercel and redeploying shows the opt-in checkbox and turns on the Brevo list sync — no code change |
| `CRON_SECRET` | Generate a long random value, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Set the **same value** in Vercel and as a GitHub Actions secret (see [GitHub Actions secrets](#github-actions-secrets)) |
| Turnstile keys | Cloudflare dashboard → **Turnstile**. Add `localhost` to the widget's hostname allowlist for local dev |
| `NEXT_PUBLIC_BEHOLD_FEED_ID` | [behold.so](https://behold.so) feed settings |

> `DATABASE_POOLED_URL` is read at import time — any route touching the database fails to load without it.

`VERCEL_ENV` is set automatically by Vercel; `robots.ts` only allows indexing when it equals `production`.

Don't set `NODE_ENV` yourself, locally or in Vercel — Next sets it (`development` for `next dev`, `production` for builds), and overriding it causes inconsistent behaviour.

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

## Content updates

Published Studio edits reach the cached site through a webhook, not through visitors' browsers. `next-sanity` v13's `<SanityLive>` only refreshes an editor's own preview in draft mode, and otherwise relies on whoever happens to be connected — with nobody on the site at publish time, the cached pages would stay stale indefinitely.

| Who | On publish |
| --- | --- |
| Editors in Presentation (draft mode) | Preview refreshes immediately (`<SanityLive>`) |
| Visitors with a page already open | See the change on their next navigation or refresh |
| Everyone else | Fresh content on their next visit (webhook) |

### Sanity revalidate webhook

Configure in **sanity.io/manage → API → Webhooks**:

- **URL:** `<NEXT_PUBLIC_SITE_URL>/api/webhooks/sanity-revalidate`
- **Dataset:** `production`
- **Trigger on:** create, update, delete
- **Filter:** leave empty (any document type)
- **Drafts:** excluded — only published changes should revalidate the public site
- **Projection:** leave empty (the payload is ignored)
- **Secret:** same value as `SANITY_REVALIDATE_SECRET`

Any published change revalidates every page (`revalidatePath('/', 'layout')`); each page re-renders on its next visit. Fine at this site's size — swap in tag-precise invalidation if it grows.

### Caching

The site uses Next's [Cache Components](https://nextjs.org/docs/app/getting-started/caching): nothing is cached unless marked `'use cache'`, and request-time reads must sit inside a Suspense boundary. Background in [`docs/next-sanity-v13-migration.md`](docs/next-sanity-v13-migration.md).

- **All Sanity queries go through a wrapper in `web/sanity/fetch.ts`.** Each is a `'use cache'` scope; its arguments form the cache key.
- **Every wrapper takes `FetchOptions`** (`perspective` + `stega`) from `web/sanity/fetchOptions.ts`. Cached code can't read cookies, so these are resolved outside and passed in. `defineLive` runs in strict mode, so a missing option is an error rather than silently published content in Presentation:

  | Where | Use |
  | --- | --- |
  | Page content, `Nav`, `Footer` | `getDynamicFetchOptions()` |
  | `generateMetadata` | `getMetadataFetchOptions()` — no stega in titles or share cards |
  | `generateStaticParams`, server actions, order pages | `PUBLISHED_FETCH_OPTIONS` — never drafts |

- **Lifetimes:** Sanity data is long-lived (expired on publish by the webhook). `getPageBySlug` uses `cacheLife('hours')` so upcoming/past event lists roll over. Within a scope the shortest `cacheLife` wins, and a page lives as long as the shortest thing it renders — a short lifetime in a shared component (e.g. the nav) shortens every page.
- **Reading the clock** (`new Date()`, `Date.now()`) during a prerender fails the build — put it in a cached function with a `cacheLife` (see `getCurrentYear` in `Footer.tsx`).
- **Local builds and stale content:** `.next/cache/fetch-cache` survives rebuilds and only production receives the publish webhook. If a local build shows content you've since edited, delete `web/.next/cache/fetch-cache` and rebuild.

---

## Ticketing

Purchase flow, end to end:

1. `/events/[slug]` renders tiers from Sanity; `TierPicker` fetches live availability from `/api/stock/[eventDetailsId]`.
2. The `createOrder` server action validates input, applies the rate limit (Turnstile challenge once exceeded), and atomically reserves stock in Postgres (`lib/reserveOrder.ts`).
3. A SumUp hosted checkout is created and the buyer is redirected to it.
4. SumUp calls `/api/webhooks/sumup`. The handler re-fetches the checkout status from SumUp, then marks the order paid and issues one ticket per admission. The buyer's "Back to merchant website" button leads to `/orders/[token]`, which confirms the same way if it gets there first.
5. Whichever sees the order paid first — webhook or order page — emails the tickets via Brevo (`lib/sendOrderConfirmation.ts`, run with `after()` so neither waits on it): one PNG QR per ticket plus a link to the order page. An atomic claim on `orders.confirmation_sent_at` sends it once; a failed send is released and retried by the next webhook delivery, order-page visit, or the **hourly retry** (`.github/workflows/retry-confirmations.yml` → `POST /api/cron/retry-confirmations`). A failed retry fails the workflow, so GitHub emails the repo owner — what to do next is in [`docs/brevo-quota-plan.md`](docs/brevo-quota-plan.md).
6. Alongside the email (`lib/runPaidOrderFollowUps.ts`), a buyer who ticked the marketing checkbox is added to the Brevo list (`lib/syncMarketingOptIn.ts`) — paid orders only, never abandoned checkouts. Same claim-and-retry pattern on `orders.marketing_synced_at`, retried by the same hourly job. The contact records their consent as attributes — `OPT_IN_SOURCE`, `OPT_IN_DATE` (UK date), `OPT_IN_WORDING` (the checkbox text, from `lib/marketingOptIn.ts`), `OPT_IN_ORDER`, plus `LAST_EVENT`. It never touches a contact's unsubscribe (blocklist) status: someone who unsubscribed stays unsubscribed even if they tick the box again. **Dormant by default:** with `MARKETING_OPT_IN_ENABLED` unset, the checkbox is hidden, `createOrder` records every order as not opted in whatever the request says, and the sync and its retry do nothing.

Abandoned reservations are released lazily after 20 minutes (the 15-minute SumUp checkout plus a 5-minute margin, `lib/reservationWindow.ts`) — no cron job.

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

**Required Vercel environment variables** — add every variable from `web/.env.local` to the Vercel project settings (for **Production**), with `NEXT_PUBLIC_SITE_URL` set to the deployed domain, plus the production-only `SANITY_REVALIDATE_SECRET` and `CRON_SECRET`. `NEXT_PUBLIC_*` values are inlined at build time, so changing one needs a **redeploy**; server-only values are read at runtime but still only reach existing deployments after a redeploy.

> **`NEXT_PUBLIC_SITE_URL` must be the exact canonical address, `https://www.c58.uk`** — not `c58.uk` or `c58.vercel.app`, which redirect to it. It builds the URLs that SumUp calls back (the payment webhook) and that emails link to, and SumUp's webhook doesn't follow redirects. Get it wrong and payments still go through, but orders stay `pending` until the buyer clicks back to the site — seen in production on 2026-11-05, when it pointed at a redirecting domain.

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
| `CRON_SECRET` | `retry-confirmations.yml` — hourly retry of unsent order confirmation emails. Same value as Vercel's `CRON_SECRET` |

---

## Docs

- **CMS Guide** — accessible via the Guide tab inside Sanity Studio
- [`docs/roadmaps/mvp.md`](docs/roadmaps/mvp.md) — site roadmap
- [`docs/roadmaps/ticketing.md`](docs/roadmaps/ticketing.md) — ticketing roadmap and implementation notes
- [`docs/adrs/`](docs/adrs/) — architecture decision records
- [`docs/sale-architecture.md`](docs/sale-architecture.md) — ticket sales design sketch
- [`docs/brevo-quota-plan.md`](docs/brevo-quota-plan.md) — staying inside Brevo's daily email limit, and when to upgrade
