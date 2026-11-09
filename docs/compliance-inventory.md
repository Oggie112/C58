# Compliance Inventory — Privacy, Cookies and Ticket Terms

What the site actually collects, where it goes, and the decisions still needed — the factual basis for writing the **privacy policy**, **cookie policy** and **ticket terms and conditions**. Compiled from the code on 2026-11-09; update it whenever a feature adds a data flow, cookie or third party.

> **Not legal advice.** This lists facts and open decisions for whoever writes the policies (you, or an adviser). It doesn't supply legal wording.

Markers: **⚠ Decide** — a business decision the code can't make. **⚠ Check** — a fact that can't be confirmed from the code.

## 1. Who you are

Needed by all three documents:

- Business **legal name**, **trading name**, **postal address**
- **Contact email** for data requests and complaints
- **⚠ Check — ICO registration:** most UK businesses processing personal data must pay the ICO data protection fee; policies usually quote the registration number

## 2. Personal data collected

| Data | Where | Why | Kept for (today) |
| --- | --- | --- | --- |
| **Email address** | `orders` — **Supabase, London (eu-west-2)** | Delivering tickets and the order page; resends | **Indefinitely** — no deletion. **⚠ Decide** a retention period (accounting records are commonly kept 6 years) |
| **Order details** — tiers, quantities, prices, status, timestamps | `orders`, `order_items` | The sale, accounting, door validation | Indefinitely — same decision |
| **Ticket codes and status** (valid / used / voided) | `tickets` | Admission and scanning | Indefinitely — same decision |
| **Order access token** | `orders.access_token` | The private order-page link | As the order |
| **SumUp checkout id** | `orders.provider_session_id` | Matching payments | As the order |
| **Marketing consent** — yes/no and when | `orders.marketing_opt_in`, `created_at`, `marketing_synced_at` | Evidence of consent | As the order |
| **IP address + time of each checkout attempt** | `reservation_attempts` | Rate limiting / bot protection | **~10 minutes** — deleted when the next checkout attempt runs after that, so on a quiet site it can persist longer. **⚠ Decide** whether to guarantee it (see §7) |
| **Card details** | **Never reach C58** — entered on SumUp's hosted page | Payment | SumUp's responsibility |

**Not collected:** names, phone numbers, postal addresses, dates of birth. No user accounts.

## 3. Who else receives data

| Service | Receives | Purpose | Location |
| --- | --- | --- | --- |
| **Supabase** | Everything in §2 | Database | **London** |
| **Vercel** | Every request's **IP, user agent and URL** — including order-page URLs, which contain the access token; function logs contain order ids | Hosting | **⚠ Check:** no region is configured in the repo, so server functions likely run in Vercel's **default US region**, an international transfer (and every request crossing the Atlantic to a London database). **⚠ Check** log retention on the current plan |
| **Vercel Web Analytics / Speed Insights** | Page views and performance — **cookieless**; order tokens **redacted** from URLs (`RedactedAnalytics`) | Analytics | Vercel |
| **SumUp** | Order amount and reference; card details entered directly with SumUp | Payment | SumUp (UK/EU) — also a controller for payment data in its own right |
| **Brevo** (Sendinblue SAS, France) | **Transactional:** email, order details, ticket codes, QR images. **Marketing (opted-in only):** email plus `OPT_IN_SOURCE`, `OPT_IN_DATE`, `OPT_IN_WORDING`, `OPT_IN_ORDER`, `LAST_EVENT` | Ticket emails; marketing | EU. Opens/clicks tracked **anonymously**; Brevo keeps send/delivery logs |
| **Cloudflare Turnstile** | **IP and browser signals.** The script loads on **every event page with tickets on sale**, not only when a challenge appears; challenge verification also sends the IP | Bot protection | Global |
| **Google Maps** (embed) | Visitor IP and Google's **cookies**, on any page whose contact block shows a map | Showing the location | US/global — see §4 |
| **Behold / Instagram** | Visitor IP when the Instagram feed block loads | Instagram feed | **⚠ Check** location and cookies |
| **Sanity** | Content only; visitors' browsers fetch **hero background videos** straight from `cdn.sanity.io` (images go via Vercel instead); editors have Sanity accounts | CMS | **⚠ Check** data location |
| **GitHub Actions** | Nothing personal — the hourly retry logs counts only | Scheduled retry | — |
| **Google Fonts** | **Nothing** — `next/font` self-hosts the fonts at build time | — | — |

## 4. Cookies and similar technologies

| Cookie / technology | Set by | For | Essential? | Consent? |
| --- | --- | --- | --- | --- |
| **None for ordinary visitors** | C58's own code | — | — | — |
| `__prerender_bypass`, Sanity perspective cookie | Next.js / next-sanity | **Editors in draft mode only** | Strictly necessary | No |
| **Google Maps embed** | Google | Visitors to pages with a map | **No** | **Very likely required before it loads** (PECR). **⚠ Decide:** consent banner, click-to-load placeholder, or a plain link (see §7) |
| Cloudflare Turnstile | Cloudflare | Event-page visitors | Arguably (security) | **⚠ Check** Cloudflare's current statement on Turnstile's cookies / local storage |
| Behold / Instagram feed | Behold / Instagram | Pages with the feed | No | **⚠ Check** — if it sets cookies, same decision as Maps |
| Vercel Analytics | Vercel | All visitors | — | Cookieless by design; usually no consent needed, but name it |

## 5. Marketing email

- **Consent:** an **unticked** checkbox at checkout — *"Keep me posted about future C58 events and news."* — stored word for word with each contact (`lib/marketingOptIn.ts`)
- **Who's added:** buyers of **paid** orders who ticked it — abandoned checkouts never are
- **Evidence:** the order row, plus Brevo attributes for source, UK date, wording, order and last event
- **Unsubscribing:** Brevo's link in each campaign. **An unsubscribe always wins**, even if the person ticks the box again on a later purchase
- **⚠ Decide:** what you'll send and how often (events? news? partner offers — which would need wording that says so)

## 6. Ticket terms and conditions

- **Contract:** formed when payment succeeds; tickets delivered **by email and on the order page**
- **Cancellation rights:** UK consumer law generally gives **no 14-day cancellation right for event tickets for a specific date** (leisure-services exemption) — say so explicitly
- **⚠ Decide — refunds:** event **cancelled**, **postponed**, **line-up changed**, buyer **changes their mind**. (A `refunded` status exists; no refund process is built)
- **⚠ Decide — admission:** **one entry per QR code** (scanned once at the door, Milestone 9), right to refuse entry, **age restrictions / ID** (bar), conduct, re-entry
- **⚠ Decide — transfers and resale:** tickets aren't tied to a name, so they're transferable in practice — allow it, or forbid resale above face value?
- **Lost tickets:** the email can be resent (order-page link; resend form 8UI.3 when built)
- **Price:** the total shown is the total charged — **no booking fee**. **⚠ Check:** VAT-inclusive? Is the business VAT-registered?
- Liability limits, **governing law (England and Wales)**, complaints contact

## 7. Code changes that would simplify the policies

1. **Vercel function region → London (`lhr1`)** — matches the database, removes a likely US transfer
2. **Google Maps → click-to-load or a link** — avoids needing a consent banner for one embed
3. **Guaranteed IP cleanup** — delete `reservation_attempts` older than 10 minutes from the hourly job, not only on the next checkout
4. **Load Turnstile only when a challenge is needed** — most visitors would never contact Cloudflare
5. **Retention** — automated deletion or anonymisation of old orders, once a period is chosen
6. **Order tokens in Vercel request logs** — known and accepted; mention in the policy, or check whether Vercel log retention can be shortened
