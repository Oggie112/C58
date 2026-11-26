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
# Shared secret for the follow-up retry endpoint; must match the CRON_SECRET
# GitHub Actions secret and the `cron_secret` in Supabase Vault
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

### Search engines

- **`/sitemap.xml`** (`app/sitemap.ts`) lists every published page, event, post and talent with its last edit; `robots.txt` points at it in production only (previews disallow all crawling). It's rendered per request (`connection()`), with its Sanity data cached for at most an hour — a cached sitemap never refreshed in production. Submitted in Google Search Console.
- **One `<h1>` per page** (`lib/pageHeading.ts`): a **Heading 1** in a Rich Text block becomes the page's main heading — use one per page (the Studio warns otherwise). Without one, the first block with a heading (e.g. "EVENTS") is used. The home page's hero has no text, so its intro section should carry the Heading 1.
- **Structured data** (`lib/structuredData.ts`, rendered by `app/components/JsonLd.tsx`): schema.org **Event** on each event page, **Organization** on the home page. It only restates what the page shows, so keep events' **Venue address** and **Doors open (24-hour)** filled in — without an address, Google won't list the event. **Ends (24-hour)** is optional (earlier than Doors open means after midnight), and the event details' **line-up** becomes the event's performers. Check a page with Google's [Rich Results Test](https://search.google.com/test/rich-results).

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

1. `/events/[slug]` renders tiers from Sanity; `TierPicker` fetches live availability from `/api/stock/[eventDetailsId]` and shows the live sale state — on sale, sold out, not yet on sale or closed, per event and per tier (`lib/saleState.ts`).
2. The `createOrder` server action validates input, applies the rate limit (Turnstile challenge once exceeded), checks the event is on sale (the editor's status wins; online sales close at 00:00 UK time on the event date), and atomically reserves stock in Postgres (`lib/reserveOrder.ts`), refusing a tier outside its `saleStart`/`saleEnd` window.
3. A SumUp hosted checkout is created and the buyer is redirected to it.
4. SumUp calls `/api/webhooks/sumup`. The handler re-fetches the checkout status from SumUp, then marks the order paid and issues one ticket per admission. The buyer's "Back to merchant website" button leads to `/orders/[token]`, which confirms the same way if it gets there first.
5. Whichever sees the order paid first — webhook or order page — emails the tickets via Brevo (`lib/sendOrderConfirmation.ts`, run with `after()` so neither waits on it): one PNG QR per ticket plus a link to the order page. An atomic claim on `orders.confirmation_sent_at` sends it once; a failed send is released and retried by the next webhook delivery, order-page visit, or the **hourly retry** — a Supabase `pg_cron` job calling `POST /api/cron/retry-confirmations` (see below). A **daily watchdog** (`.github/workflows/retry-confirmations.yml`) calls the same endpoint and fails if anything is still failing, so GitHub emails the repo owner — what to do next is in [`docs/brevo-quota-plan.md`](docs/brevo-quota-plan.md).
6. Alongside the email (`lib/runPaidOrderFollowUps.ts`), a buyer who ticked the marketing checkbox is added to the Brevo list (`lib/syncMarketingOptIn.ts`) — paid orders only, never abandoned checkouts. Same claim-and-retry pattern on `orders.marketing_synced_at`, retried by the same hourly job. The contact records their consent as attributes — `OPT_IN_SOURCE`, `OPT_IN_DATE` (UK date), `OPT_IN_WORDING` (the checkbox text, from `lib/marketingOptIn.ts`), `OPT_IN_ORDER`, plus `LAST_EVENT`. It never touches a contact's unsubscribe (blocklist) status: someone who unsubscribed stays unsubscribed even if they tick the box again. **Dormant by default:** with `MARKETING_OPT_IN_ENABLED` unset, the checkbox is hidden, `createOrder` records every order as not opted in whatever the request says, and the sync and its retry do nothing.

7. **Lost the email?** `/orders` (linked under the ticket picker and in the footer) takes an address and resends the tickets for its paid orders whose event is today or later — at most 5 orders, each at most once every 30 minutes (`lib/requestTicketResend.ts`, `lib/sendTicketResend.ts`). The reply is identical whatever the address and goes out before any lookup (the work runs in `after()`), so it never reveals whether an address has bought. Same rate limit and Turnstile challenge as checkout. A resend that fails (quota, outage) stays queued on `orders.resend_requested_at` and goes out with the hourly retry, after first confirmations.

Abandoned reservations are released lazily after 20 minutes (the 15-minute SumUp checkout plus a 5-minute margin, `lib/reservationWindow.ts`) — no cron job.

### Scheduled database jobs

Three **`pg_cron` jobs** run inside Supabase. The Testcontainers database has neither `pg_cron` nor `pg_net`, so these migrations skip themselves there.

| Job | Schedule | Does | Migration |
| --- | --- | --- | --- |
| `clean-up-reservation-attempts` | Every 5 minutes | Deletes the rate limit's stored IPs past its 10-minute window | `20261120120000_schedule_reservation_attempts_cleanup.sql` |
| `clean-up-cron-history` | Daily, 03:00 UTC | Keeps a week of `cron.job_run_details` (pg_cron never prunes it) | same |
| `retry-paid-order-follow-ups` | Hourly at :17 | `pg_net` POST to `https://www.c58.uk/api/cron/retry-confirmations`, timeout 60s — retries first confirmations, then queued resends, then marketing sync; answers `{ confirmations, resends, marketing }` | `20261123120000_schedule_follow_up_retry.sql` |

**One-off setup:** the retry job reads `CRON_SECRET` from Supabase Vault — it's never in the repo. Create it once in the SQL editor (same value as Vercel's), and update it there too whenever the secret is rotated:

```sql
select vault.create_secret('<CRON_SECRET>', 'cron_secret');
-- rotating: select vault.update_secret(id, '<new value>') from vault.secrets where name = 'cron_secret';
```

**Checking them:**

```sql
-- The jobs, and whether they're active
select jobname, schedule, active from cron.job;

-- Recent runs (a run "succeeds" once its SQL runs — for the retry, that's queuing the request)
select j.jobname, d.status, d.return_message, d.start_time
from cron.job_run_details d join cron.job j using (jobid)
order by d.start_time desc limit 10;

-- What the retry endpoint actually answered (kept ~6 hours): expect 200 and a counts-only body
select created, status_code, content, error_msg
from net._http_response order by created desc limit 5;
```

`pg_net` can't alert anyone, so the daily GitHub watchdog stays: it fails — and GitHub emails the repo owner — on an endpoint error or a failed send.

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

Migrations live in `supabase/migrations/`. Apply with the Supabase CLI (v3+):

```bash
supabase link --project-ref <project-ref>
supabase db push --remote   # without --remote, v3 targets the local stack; answer y (Enter means No)
```

On Windows, **Smart App Control** can block a brand-new CLI release ("An Application Control policy has blocked this file"): the binary is unsigned, so it's allowed only once it has built up reputation. Pin the last release that runs — e.g. `npx supabase@3.0.0 db push --remote` — rather than turning Smart App Control off. Don't apply a migration by pasting it into the SQL editor: it wouldn't be recorded in the migration history, so the next push would run it again.

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
| `retry-confirmations.yml` | `SITE_URL: https://www.c58.uk` |
| Migration `20261123120000_schedule_follow_up_retry.sql` | The retry job's URL — a domain change needs a new migration re-scheduling it |
| sanity.io/manage → API → CORS origins | `https://www.c58.uk`, with credentials allowed — needed for live draft previews |

### GitHub Actions secrets

| Secret | Used by |
| --- | --- |
| `SANITY_AUTH_TOKEN` | `deploy-studio.yml` — Studio deploys |
| `DATABASE_POOLED_URL` | `supabase-keepalive.yml` — pings the database twice weekly so the free tier doesn't pause |
| `CRON_SECRET` | `retry-confirmations.yml` — daily watchdog run of the follow-up retry. Same value as Vercel's `CRON_SECRET` and Supabase Vault's `cron_secret` |

---

## Docs

- **CMS Guide** — accessible via the Guide tab inside Sanity Studio
- [`docs/roadmaps/mvp.md`](docs/roadmaps/mvp.md) — site roadmap
- [`docs/roadmaps/ticketing.md`](docs/roadmaps/ticketing.md) — ticketing roadmap and implementation notes
- [`docs/adrs/`](docs/adrs/) — architecture decision records
- [`docs/sale-architecture.md`](docs/sale-architecture.md) — ticket sales design sketch
- [`docs/brevo-quota-plan.md`](docs/brevo-quota-plan.md) — staying inside Brevo's daily email limit, and when to upgrade
- [`docs/compliance-inventory.md`](docs/compliance-inventory.md) — what personal data the site collects, who receives it, cookies, and the decisions behind the privacy policy, cookie policy and ticket terms
