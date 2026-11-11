# Compliance Inventory — Privacy, Cookies and Ticket Terms

What the site actually collects, where it goes, and what's still to decide — the factual basis for writing the **privacy policy**, **cookie policy** and **ticket terms and conditions**. Compiled from the code on 2026-11-09, updated 2026-11-11. Update it whenever a feature adds a data flow, cookie or third party.

> **Not legal advice.** This lists facts and open decisions for whoever writes the policies (you, or an adviser). It doesn't supply legal wording.

## Decisions and checks

Everything still open, in one place. Each links to the section with the detail.

### Decisions (business calls the code can't make)

| # | Decision | Affects | Detail |
| --- | --- | --- | --- |
| D1 | **Retention period** for orders, tickets and buyer emails (accounting records are commonly kept 6 years) | Privacy policy; enables code fix C4 | [§2](#2-personal-data-collected) |
| D2 | **Google Maps embed:** click-to-load placeholder, plain link to Google Maps, or a consent banner | Cookie policy; code fix C1 | [§4](#4-cookies-and-similar-technologies) |
| D3 | **Marketing scope:** what you'll send and how often — events, news, partner offers (partner offers need wording that says so) | Privacy policy; possibly the checkbox wording | [§5](#5-marketing-email) |
| D4 | **Refunds:** event cancelled, postponed, line-up changed, buyer changes their mind | Ticket T&Cs; a refund process (none built) | [§6](#6-ticket-terms-and-conditions) |
| D5 | **Admission:** one entry per QR code, right to refuse entry, age restrictions / ID, conduct, re-entry | Ticket T&Cs | [§6](#6-ticket-terms-and-conditions) |
| D6 | **Transfers and resale:** allow, or forbid resale above face value | Ticket T&Cs | [§6](#6-ticket-terms-and-conditions) |
| D7 | **Re-subscribing after an unsubscribe:** someone who unsubscribed stays unsubscribed even if they tick the box again — keep this (the cautious default), or offer a way back in (e.g. a Brevo sign-up form) | Privacy policy; marketing practice | [§5](#5-marketing-email) |

### Checks (facts that can't be confirmed from the code)

| # | Check | Where to look |
| --- | --- | --- |
| K1 | **ICO registration** — most UK businesses processing personal data must pay the data protection fee; the policy usually quotes the number | ico.org.uk |
| K2 | **VAT:** are prices VAT-inclusive, and is the business VAT-registered? | Accountant / HMRC |
| K3 | **Vercel log retention** on the current plan — request logs include order-page URLs (which contain the access token) | Vercel → Settings / plan details |
| K4 | **Cloudflare Turnstile** — does it set cookies or use local storage? | Cloudflare's Turnstile privacy documentation |
| K5 | **Behold / Instagram feed** — data location, and whether it sets cookies | Behold's documentation / privacy policy |
| K6 | **Sanity data location** (hero background videos load straight from `cdn.sanity.io`, so Sanity sees visitors' IPs) | Sanity → project settings / their privacy documentation |

### Code fixes (would simplify the policies)

| # | Fix | Why | Depends on |
| --- | --- | --- | --- |
| C1 | **Google Maps → click-to-load or a link** | Avoids a consent banner for a single embed | D2 |
| C2 | **Guaranteed IP cleanup** — the hourly job deletes `reservation_attempts` older than 10 minutes | Today they're only deleted on the next checkout attempt, so "kept for 10 minutes" isn't strictly true on a quiet site | — |
| C3 | **Load Turnstile only when a challenge is needed** | Today every visitor to an on-sale event page contacts Cloudflare; most would never need to | — |
| C4 | **Automated deletion or anonymisation** of orders past the retention period | Makes the stated retention period true without manual work | D1 |
| C5 | **Enforce tier `saleStart` / `saleEnd`** (roadmap 8API.5) | Not privacy, but the ticket terms will describe sale windows the site doesn't currently enforce | — |

### Resolved

- **Vercel function region** — confirmed **London (`lhr1`)** on 2026-11-11, matching the database. No international transfer for server-side processing.
- **Order-page tokens in analytics** — redacted before Vercel Analytics and Speed Insights see them (`RedactedAnalytics`).
- **Marketing sync respects unsubscribes** — verified end to end on 2026-11-09 (8API.3).

## 1. Who you are

Needed by all three documents:

- Business **legal name**, **trading name**, **postal address**
- **Contact email** for data requests and complaints
- ICO registration number (K1)

## 2. Personal data collected

| Data | Where | Why | Kept for (today) |
| --- | --- | --- | --- |
| **Email address** | `orders` — **Supabase, London (eu-west-2)** | Delivering tickets and the order page; resends | **Indefinitely** — no deletion (D1) |
| **Order details** — tiers, quantities, prices, status, timestamps | `orders`, `order_items` | The sale, accounting, door validation | Indefinitely (D1) |
| **Ticket codes and status** (valid / used / voided) | `tickets` | Admission and scanning | Indefinitely (D1) |
| **Order access token** | `orders.access_token` | The private order-page link | As the order |
| **SumUp checkout id** | `orders.provider_session_id` | Matching payments | As the order |
| **Marketing consent** — yes/no and when | `orders.marketing_opt_in`, `created_at`, `marketing_synced_at` | Evidence of consent | As the order |
| **IP address + time of each checkout attempt** | `reservation_attempts` | Rate limiting / bot protection | **~10 minutes**, deleted when the next checkout attempt runs after that — can persist longer on a quiet site (C2) |
| **Card details** | **Never reach C58** — entered on SumUp's hosted page | Payment | SumUp's responsibility |

**Not collected:** names, phone numbers, postal addresses, dates of birth. No user accounts.

## 3. Who else receives data

| Service | Receives | Purpose | Location |
| --- | --- | --- | --- |
| **Supabase** | Everything in §2 | Database | **London** |
| **Vercel** | Every request's **IP, user agent and URL** — including order-page URLs, which contain the access token (K3); function logs contain order ids | Hosting | Functions in **London**; Vercel's CDN serves cached pages from its global edge network |
| **Vercel Web Analytics / Speed Insights** | Page views and performance — **cookieless**; order tokens **redacted** from URLs | Analytics | Vercel |
| **SumUp** | Order amount and reference; card details entered directly with SumUp | Payment | SumUp (UK/EU) — also a controller for payment data in its own right |
| **Brevo** (Sendinblue SAS, France) | **Transactional:** email, order details, ticket codes, QR images. **Marketing (opted-in only):** email plus `OPT_IN_SOURCE`, `OPT_IN_DATE`, `OPT_IN_WORDING`, `OPT_IN_ORDER`, `LAST_EVENT` | Ticket emails; marketing | EU. Opens/clicks tracked **anonymously**; Brevo keeps send/delivery logs |
| **Cloudflare Turnstile** | **IP and browser signals.** The script loads on **every event page with tickets on sale** (C3); challenge verification also sends the IP | Bot protection | Global (K4) |
| **Google Maps** (embed) | Visitor IP and Google's **cookies**, on any page whose contact block shows a map | Showing the location | US/global (D2) |
| **Behold / Instagram** | Visitor IP when the Instagram feed block loads | Instagram feed | K5 |
| **Sanity** | Content only; visitors' browsers fetch **hero background videos** straight from `cdn.sanity.io` (images go via Vercel); editors have Sanity accounts | CMS | K6 |
| **GitHub Actions** | Nothing personal — the hourly retry logs counts only | Scheduled retry | — |
| **Google Fonts** | **Nothing** — `next/font` self-hosts the fonts at build time | — | — |

## 4. Cookies and similar technologies

| Cookie / technology | Set by | For | Essential? | Consent? |
| --- | --- | --- | --- | --- |
| **None for ordinary visitors** | C58's own code | — | — | — |
| `__prerender_bypass`, Sanity perspective cookie | Next.js / next-sanity | **Editors in draft mode only** | Strictly necessary | No |
| **Google Maps embed** | Google | Visitors to pages with a map | **No** | **Very likely required before it loads** (PECR) — D2 / C1 |
| Cloudflare Turnstile | Cloudflare | Event-page visitors | Arguably (security) | K4 |
| Behold / Instagram feed | Behold / Instagram | Pages with the feed | No | K5 — if it sets cookies, same decision as Maps |
| Vercel Analytics | Vercel | All visitors | — | Cookieless by design; usually no consent needed, but name it |

## 5. Marketing email

- **Consent:** an **unticked** checkbox at checkout — *"Keep me posted about future C58 events and news."* — stored word for word with each contact (`lib/marketingOptIn.ts`)
- **Who's added:** buyers of **paid** orders who ticked it — abandoned checkouts never are
- **Evidence:** the order row, plus Brevo attributes for source, UK date, wording, order and last event
- **Unsubscribing:** Brevo's link in each campaign. **An unsubscribe always wins**, even if the person ticks the box again on a later purchase (D7)
- What you'll send and how often: D3

## 6. Ticket terms and conditions

- **Contract:** formed when payment succeeds; tickets delivered **by email and on the order page**
- **Cancellation rights:** UK consumer law generally gives **no 14-day cancellation right for event tickets for a specific date** (leisure-services exemption) — say so explicitly
- **Refunds:** D4 (a `refunded` status exists; no refund process is built)
- **Admission:** D5 — the door scanner (Milestone 9) will enforce one entry per QR code
- **Transfers and resale:** D6 — tickets aren't tied to a name, so they're transferable in practice
- **Lost tickets:** the email can be resent (order-page link; resend form 8UI.3 when built)
- **Price:** the total shown is the total charged — **no booking fee** (VAT: K2)
- **Sale windows:** tiers can have start/end times — not enforced until C5
- Liability limits, **governing law (England and Wales)**, complaints contact
