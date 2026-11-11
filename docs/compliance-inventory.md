# Compliance Inventory — Privacy, Cookies and Ticket Terms

What the site actually collects, where it goes, and what's still to decide — the factual basis for writing the **privacy policy**, **cookie policy** and **ticket terms and conditions**. Compiled from the code on 2026-11-09, updated 2026-11-11. Update it whenever a feature adds a data flow, cookie or third party.

> **Not legal advice.** This lists facts and open decisions for whoever writes the policies (you, or an adviser). It doesn't supply legal wording.

## Decisions and checks

Everything open or decided, in one place. Each links to the section with the detail. Status: ✅ decided/answered · 🟡 partly — follow-up open · ⏳ waiting on something.

### Decisions (business calls the code can't make)

| # | Decision | Status | Answer / what's still open |
| --- | --- | --- | --- |
| D1 | **Retention period** | 🟡 | **6 years** (2026-11-11). **Open:** 6 years matches HMRC record-keeping for a **limited company** — confirm the business structure (sole traders' periods are calculated differently). And 6 years is for **financial** records: should the buyer's **email** be anonymised earlier (e.g. 12 months after the event) while the financial row is kept? → C4 |
| D2 | **Google Maps embed** | ✅ | **Click-to-load** placeholder (~40 lines) rather than a consent banner. A banner only becomes unavoidable if tracking (e.g. Meta/Google Analytics) or more third-party embeds are added — revisit then. → C1 |
| D3 | **Marketing scope** | ✅ | **Marketing and news only — no partners** (can extend later, with new consent wording). Content: upcoming events, pop-ups, news about DJs C58 is working with or whose house DJs are playing notable events, and where the business is going. **Frequency** not yet set |
| D4 | **Refunds** | 🟡 | **Cancelled → full refund. Postponed → refunded** (proposed: ticket stays valid for the new date, refund on request within a set window). **No refund for change of mind** (the leisure-services exemption; normal industry practice). **Open:** line-up changes — proposed: no refund for minor changes ("line-up subject to change"), refund if an advertised **headline act** pulls out and the event is materially different (a blanket "no refunds" term risks being unfair under the Consumer Rights Act 2015). No refund process is built yet |
| D5 | **Admission** | 🟡 | One entry per QR code, right to refuse entry, conduct rules — **wording**, agreed in principle. **Open:** age limit (18+ with ID?) and whether **re-entry** is allowed |
| D6 | **Transfers and resale** | 🟡 | **Resale forbidden. Transfers by contacting C58.** **Open:** what a transfer involves — tickets aren't name-bound, so in practice it means changing the order's email and re-sending (a manual database edit today; an admin feature later). Is the aim to know who holds each ticket, or mainly to discourage resale? |
| D7 | **Re-subscribing after an unsubscribe** | ✅ | **Keep the cautious default:** an unsubscribe always wins, even if the box is ticked again |

### Checks (facts that can't be confirmed from the code)

| # | Check | Status | Answer / what's still open |
| --- | --- | --- | --- |
| K1 | **ICO registration** | ⏳ | **In progress** (not yet registered, 2026-11-11). Note: the fee usually applies to **any** personal-data processing — ticket sales already process buyers' emails and orders — so complete it before tickets go on public sale, not only before marketing. Marketing stays dormant until then → C6 |
| K2 | **VAT** | ✅ | **Not VAT-registered** (below the threshold). Prices are the total charged; no VAT statement needed beyond that. Revisit if turnover approaches the threshold |
| K3 | **Vercel log retention** | 🟡 | **1 hour on Hobby** (believed; worth confirming in the plan details). **Correction:** order-page tokens are **not** scrubbed from Vercel's request logs — `RedactedAnalytics` only redacts Analytics and Speed Insights. A known, accepted exposure (8UI.2), short-lived at 1 hour; the policy shouldn't claim logs are scrubbed |
| K4 | **Cloudflare Turnstile cookies** | ⏳ | Unclear from Cloudflare's own documentation; forum reports conflict. Working position: any cookie/storage it uses is for **bot detection**, i.e. strictly necessary security — no consent needed, but named in the policy. **Waiting on** Cloudflare's Turnstile privacy addendum. C3 reduces exposure either way |
| K5 | **Behold / Instagram feed** | 🟡 | **No cookies.** Behold keeps anonymous request logs (for quota) and serves media from C58's own Instagram account. **Open:** do visitors' browsers load the images from Behold's servers or **directly from Instagram's CDN** (`cdninstagram.com` / `fbcdn.net`)? If the latter, **Meta** sees visitor IPs and must be listed. Check: DevTools → Network on a page with the feed, filter `fbcdn` / `instagram` |
| K6 | **Sanity** | ✅ | Sanity sees visitor **IP addresses** (hero videos load from `cdn.sanity.io`); **no cookies**. List Sanity as a **processor** (not a "sub-processor" — that term is for a processor's own suppliers). Lawful basis: **legitimate interests (UK GDPR Art. 6(1)(f))** — delivering site assets. No PECR consent needed as nothing is stored on the device. **Open (minor):** Sanity's hosting location for the policy |

### Code fixes (would simplify the policies)

| # | Fix | Why | Status |
| --- | --- | --- | --- |
| C1 | **Google Maps → click-to-load** | Avoids a consent banner for a single embed | Ready (D2 decided) |
| C2 | **Guaranteed IP cleanup** — the hourly job deletes `reservation_attempts` older than 10 minutes | Today they're only deleted on the next checkout attempt, so "kept for 10 minutes" isn't strictly true on a quiet site | Ready |
| C3 | **Load Turnstile only when a challenge is needed** | Today every visitor to an on-sale event page contacts Cloudflare; most never need to | Ready |
| C4 | **Automated deletion / anonymisation** past the retention period | Makes the stated retention true without manual work | Waits on D1's follow-up |
| C5 | **Enforce tier `saleStart` / `saleEnd`** (roadmap 8API.5) | The ticket terms will describe sale windows the site doesn't currently enforce | Ready |
| C6 | **Marketing opt-in dormant** — a `MARKETING_OPT_IN_ENABLED = false` switch: checkbox hidden, `createOrder` forces opt-in off server-side, follow-ups and the hourly retry skip the sync | Lets 8API.3 (PR #56) merge with nothing collected or shared until ICO registration (K1) and the privacy policy are done; switching on is a one-line change | Ready |

### Resolved

- **Vercel function region** — confirmed **London (`lhr1`)** on 2026-11-11, matching the database. No international transfer for server-side processing.
- **Order-page tokens in analytics** — redacted before Vercel Analytics and Speed Insights see them (`RedactedAnalytics`). Not in Vercel's request logs — see K3.
- **Marketing sync respects unsubscribes** — verified end to end on 2026-11-09 (8API.3).

## 1. Who you are

Needed by all three documents:

- Business **legal name**, **trading name**, **postal address**
- **Contact email** for data requests and complaints
- ICO registration number — registration in progress (K1)
- **Business structure** (limited company or sole trader) — affects the record-keeping period behind D1

## 2. Personal data collected

| Data | Where | Why | Kept for (today) |
| --- | --- | --- | --- |
| **Email address** | `orders` — **Supabase, London (eu-west-2)** | Delivering tickets and the order page; resends | **Indefinitely today.** Decided: **6 years** — open whether the email is anonymised earlier (D1); enforced by C4 |
| **Order details** — tiers, quantities, prices, status, timestamps | `orders`, `order_items` | The sale, accounting, door validation | Indefinitely today → **6 years** (D1, C4) |
| **Ticket codes and status** (valid / used / voided) | `tickets` | Admission and scanning | Indefinitely today → **6 years** (D1, C4) |
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
| **Vercel** | Every request's **IP, user agent and URL** — including order-page URLs, which contain the access token and are **not** scrubbed here (K3; ~1 hour retention on Hobby); function logs contain order ids | Hosting | Functions in **London**; Vercel's CDN serves cached pages from its global edge network |
| **Vercel Web Analytics / Speed Insights** | Page views and performance — **cookieless**; order tokens **redacted** from URLs | Analytics | Vercel |
| **SumUp** | Order amount and reference; card details entered directly with SumUp | Payment | SumUp (UK/EU) — also a controller for payment data in its own right |
| **Brevo** (Sendinblue SAS, France) | **Transactional:** email, order details, ticket codes, QR images. **Marketing (opted-in only — dormant until C6 is switched on):** email plus `OPT_IN_SOURCE`, `OPT_IN_DATE`, `OPT_IN_WORDING`, `OPT_IN_ORDER`, `LAST_EVENT` | Ticket emails; marketing | EU. Opens/clicks tracked **anonymously**; Brevo keeps send/delivery logs |
| **Cloudflare Turnstile** | **IP and browser signals.** The script loads on **every event page with tickets on sale** (C3); challenge verification also sends the IP | Bot protection | Global (K4) |
| **Google Maps** (embed) | Visitor IP and Google's **cookies**, on any page whose contact block shows a map | Showing the location | US/global (D2) |
| **Behold / Instagram** | Visitor IP when the Instagram feed block loads; **no cookies**; Behold keeps anonymous request logs for quota. Media is C58's own Instagram content | Instagram feed | K5 — whether images come from Instagram's CDN (then **Meta** also sees IPs) |
| **Sanity** (processor) | Content only; visitors' browsers fetch **hero background videos** straight from `cdn.sanity.io`, so Sanity sees their **IP addresses** (images go via Vercel); **no cookies**; editors have Sanity accounts | CMS — legitimate interests (Art. 6(1)(f)) | K6 — hosting location |
| **GitHub Actions** | Nothing personal — the hourly retry logs counts only | Scheduled retry | — |
| **Google Fonts** | **Nothing** — `next/font` self-hosts the fonts at build time | — | — |

## 4. Cookies and similar technologies

| Cookie / technology | Set by | For | Essential? | Consent? |
| --- | --- | --- | --- | --- |
| **None for ordinary visitors** | C58's own code | — | — | — |
| `__prerender_bypass`, Sanity perspective cookie | Next.js / next-sanity | **Editors in draft mode only** | Strictly necessary | No |
| **Google Maps embed** | Google | Visitors who **choose to load the map** (once C1 is built; today, everyone on the page) | **No** | Yes — **click-to-load** decided (D2): the visitor's click is the consent, and nothing loads before it |
| Cloudflare Turnstile | Cloudflare | Event-page visitors (only those challenged, once C3 is built) | **Strictly necessary** (bot detection) — working position | No, but named in the policy (K4 — awaiting Cloudflare's addendum) |
| Behold / Instagram feed | Behold | Pages with the feed | — | **No cookies** (K5); name Behold as a recipient of visitor IPs |
| Vercel Analytics | Vercel | All visitors | — | Cookieless by design; usually no consent needed, but name it |

## 5. Marketing email

> **Status: dormant.** The checkbox is hidden and nothing is sent to Brevo until ICO registration (K1) and the privacy policy are done — then switched on via C6.

- **Consent:** an **unticked** checkbox at checkout — *"Keep me posted about future C58 events and news."* — stored word for word with each contact (`lib/marketingOptIn.ts`)
- **Who's added:** buyers of **paid** orders who ticked it — abandoned checkouts never are
- **Evidence:** the order row, plus Brevo attributes for source, UK date, wording, order and last event
- **Unsubscribing:** Brevo's link in each campaign. **An unsubscribe always wins**, even if the person ticks the box again on a later purchase (D7)
- **Content (D3):** marketing and news only — upcoming events and pop-ups, news about DJs C58 is working with or whose house DJs are playing notable events, and where the business is going. **No partner offers** (would need new consent wording). Frequency not yet set

## 6. Ticket terms and conditions

- **Contract:** formed when payment succeeds; tickets delivered **by email and on the order page**
- **Cancellation rights:** UK consumer law generally gives **no 14-day cancellation right for event tickets for a specific date** (leisure-services exemption) — say so explicitly
- **Refunds (D4):** event **cancelled → full refund**; **postponed → refund** (proposed: ticket valid for the new date, refund on request within a set window); **no refund for change of mind**; line-up changes — proposed: none for minor changes, refund if an advertised headline act pulls out and the event is materially different (open). A `refunded` status exists; no refund process is built
- **Admission (D5):** one entry per QR code (the Milestone 9 door scanner enforces it), right to refuse entry, conduct rules. Open: age limit / ID, re-entry
- **Transfers and resale (D6):** **resale forbidden**; **transfers by contacting C58** — tickets aren't name-bound, so a transfer means updating the order's email and re-sending (manual today)
- **Lost tickets:** the email can be resent (order-page link; resend form 8UI.3 when built)
- **Price:** the total shown is the total charged — **no booking fee**; **not VAT-registered** (K2)
- **Sale windows:** tiers can have start/end times — not enforced until C5
- Liability limits, **governing law (England and Wales)**, complaints contact
