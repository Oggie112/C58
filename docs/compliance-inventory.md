# Compliance Inventory — Privacy, Cookies and Ticket Terms

What the site actually collects, where it goes, and what's still to decide — the factual basis for writing the **privacy policy**, **cookie policy** and **ticket terms and conditions**. Compiled from the code on 2026-11-09, updated 2026-11-11. Update it whenever a feature adds a data flow, cookie or third party.

> **Not legal advice.** This lists facts and open decisions for whoever writes the policies (you, or an adviser). It doesn't supply legal wording.

## Decisions and checks

Everything open or decided, in one place. Each links to the section with the detail. Status: ✅ decided/answered · 🟡 partly — follow-up open · ⏳ waiting on something.

### Decisions (business calls the code can't make)

| # | Decision | Status | Answer / what's still open |
| --- | --- | --- | --- |
| D1 | **Retention period** | 🟡 | **6 years for the financial record** (order id, date, items, amounts, status, SumUp checkout id) — covers HMRC either way: limited company 6 years from the end of the accounting period; sole trader at least 5 years after the 31 January filing deadline (≈ 5¾–6¾ years). **Proposed: anonymise the buyer's email 12 months after the event** — for consumer sales by a non-VAT-registered business, HMRC needs income records (what, when, how much), not each customer's identity, and SumUp's records independently back every payment; 12 months clears the card-chargeback window (~120 days, occasionally longer). **Open:** confirm with the accountant ("are anonymised sales records plus SumUp's records enough?") → C4 |
| D2 | **Google Maps embed** | ✅ | **Click-to-load** placeholder (~40 lines) rather than a consent banner. A banner only becomes unavoidable if tracking (e.g. Meta/Google Analytics) or more third-party embeds are added — revisit then. → C1 |
| D3 | **Marketing scope** | ✅ | **Marketing and news only — no partners** (can extend later, with new consent wording). Content: upcoming events, pop-ups, news about DJs C58 is working with or whose house DJs are playing notable events, and where the business is going. **Frequency:** to be decided when campaigns start |
| D4 | **Refunds** | ✅ | **Cancelled → full refund. Postponed → ticket valid for the new date, refund on request within a set window. Headline act pulls out and the event is materially different → refund. Minor line-up changes → no refund** ("line-up subject to change"). **Change of mind → no refund** (leisure-services exemption). No refund process is built yet |
| D5 | **Admission** | ✅ | One entry per QR code (first scan only), right to refuse entry, conduct rules, **18+ with ID**. **Re-entry varies by event** — terms say "as stated on the event page" (a per-event Sanity field could show it automatically later) |
| D6 | **Transfers and resale** | ✅ | **Bearer tickets:** whoever holds a valid ticket can use it, so transfers and resale are the holder's business. Terms: the buyer is **responsible for keeping tickets secure** (don't post them or show the QR publicly); **only the first scan is admitted**; **C58 isn't responsible for tickets bought from anyone else** |
| D7 | **Re-subscribing after an unsubscribe** | ✅ | **Keep the cautious default:** an unsubscribe always wins, even if the box is ticked again |
| D8 | **People featured on the site** (team, volunteers, talent) | 🟡 | Their **names, photos and bios** are personal data, stored in Sanity and published. **Open:** get each person's **agreement to being featured** (a short written OK is enough — keep a record), and a **removal process**: on request, delete their document *and* its revision history in Sanity (Sanity keeps past revisions unless the document is fully deleted). The privacy policy should cover featured people as well as buyers |

### Checks (facts that can't be confirmed from the code)

| # | Check | Status | Answer / what's still open |
| --- | --- | --- | --- |
| K1 | **ICO data protection fee** | 🟡 | **Possibly exempt.** The ICO exempts processing done **only** for exempt purposes, including **accounts and records** (records of sales "to ensure payments, deliveries or services are made") and **advertising, marketing and PR for your own business** — selling, issuing and emailing tickets arguably fits both. The exemption is lost if *any* processing falls outside them — commonly **CCTV for crime prevention**; checkout rate limiting is treated here as part of the sale. **CCTV at hired venues** is the **venue's** (it decides why and how the cameras are used, and keeps the footage), so it doesn't affect C58 — unless C58 runs its own cameras, or requests footage for its own purposes and keeps it. Worth a line in venue-hire agreements confirming CCTV is the venue's responsibility. **Next:** confirm with the ICO's *"Do I need to pay the data protection fee?"* self-assessment. Fee or not, **UK GDPR still applies** (privacy policy etc.). Marketing stays dormant until the policy is done → C6 |
| K2 | **VAT** | ✅ | **Not VAT-registered** (below the threshold). Prices are the total charged; no VAT statement needed beyond that. Revisit if turnover approaches the threshold |
| K3 | **Vercel log retention** | ✅ | **1 hour on Hobby** (confirmed 2026-11-12). **Note:** order-page tokens are **not** scrubbed from Vercel's request logs — `RedactedAnalytics` only redacts Analytics and Speed Insights. A known, accepted exposure (8UI.2), short-lived at 1 hour; the policy shouldn't claim logs are scrubbed |
| K4 | **Cloudflare Turnstile** | ✅ | Per Cloudflare's **Turnstile Privacy Addendum** (last updated 18 June 2025): collects IP address, TLS fingerprint, user agent, site key and origin, and says it can't identify individuals from them. **Two roles:** a **processor for C58** when protecting the site (C58 is the controller — lawful basis: **legitimate interests in security**), and a **controller in its own right** when using the signals to improve Turnstile (its own legitimate interests). The signals are **"strictly necessary"** for bot detection — no PECR consent needed. Policy: name Cloudflare as processor, mention its own improvement use, **link to the addendum** (rather than copying it). C3 limits it to visitors actually challenged |
| K5 | **Behold / Instagram feed** | ✅ | **No cookies.** Behold keeps anonymous request logs (for quota) and **serves the images itself** — no requests to Instagram's CDN (`fbcdn` / `instagram`) in DevTools (2026-11-11), so **Meta doesn't see visitor IPs**. List Behold as a recipient of visitor IPs |
| K6 | **Sanity** | ✅ | Sanity sees visitor **IP addresses** (hero videos load from `cdn.sanity.io`); **no cookies**. List Sanity as a **processor** (not a "sub-processor" — that term is for a processor's own suppliers). Lawful basis: **legitimate interests (UK GDPR Art. 6(1)(f))** — delivering site assets. No PECR consent needed as nothing is stored on the device. **Transfers:** Sanity's official [Data Processing Addendum](https://www.sanity.io/legal/dpa) covers transfers outside the UK with the **EU Standard Contractual Clauses plus the UK International Data Transfer Addendum** (confirmed 2026-11-12). Sanity is US-headquartered; its asset CDN is global. **Hosting region:** sources conflict on whether EU (Belgium) hosting is the default on non-Enterprise plans — the policy can name the safeguard without a region; ask Sanity support if a region is wanted. See also D8 — Sanity also holds people's personal data as site content |

### Code fixes (would simplify the policies)

| # | Fix | Why | Status |
| --- | --- | --- | --- |
| C1 | **Google Maps → click-to-load** | Avoids a consent banner for a single embed | Ready (D2 decided) |
| C2 | **Guaranteed IP cleanup** — the hourly job deletes `reservation_attempts` older than 10 minutes | Today they're only deleted on the next checkout attempt, so "kept for 10 minutes" isn't strictly true on a quiet site | Ready |
| C3 | **Load Turnstile only when a challenge is needed** | Today every visitor to an on-sale event page contacts Cloudflare; most never need to | Ready |
| C4 | **Automated retention** — anonymise buyer emails 12 months after the event; delete financial rows after 6 years | Makes the stated retention true without manual work | Waits on the accountant's confirmation (D1) |
| C5 | **Enforce tier `saleStart` / `saleEnd`** (roadmap 8API.5) | The ticket terms will describe sale windows the site doesn't currently enforce | Ready |
| C6 | **Marketing opt-in dormant** — a `MARKETING_OPT_IN_ENABLED = false` switch: checkbox hidden, `createOrder` forces opt-in off server-side, follow-ups and the hourly retry skip the sync | Lets 8API.3 (PR #56) merge with nothing collected or shared until ICO registration (K1) and the privacy policy are done; switching on is a one-line change | Ready |

### Skiddle (current ticketing for existing events)

| # | Item | Status | Answer / what's still open |
| --- | --- | --- | --- |
| S1 | **Skiddle's role** | ✅ | Skiddle is the **seller of record and a controller in its own right** for its sales — it collects buyers' details under its own privacy policy and takes payment |
| S2 | **HMRC records for Skiddle sales** | ✅ | Keep **Skiddle's settlement / payout statements for 6 years** — they're C58's income records for those events, with no customer data needed |
| S3 | **Data C58 receives from Skiddle** | ✅ | **None today** — C58 can download attendee lists but doesn't. **Skiddle emails its previous buyers about new events itself**, as controller under its own policy, so C58 never holds that data. If C58 ever downloads attendee lists, it becomes controller of that copy: privacy-policy coverage and retention apply. That alone probably **wouldn't** trigger the ICO fee — door check-in and own-event marketing fall within the same exempt purposes (K1) |
| S4 | **Transition plan** | ✅ | **A clean switch** — all Skiddle or all the site's own ticketing, never both. While on Skiddle the policy needs at most one line ("tickets for some events are sold by Skiddle under its own privacy policy"). **Note for the switch:** Skiddle's past buyers are on **Skiddle's** list, not C58's — the site's own marketing list starts from zero; past buyers would need to opt in through the site |

### Resolved

- **Vercel function region** — confirmed **London (`lhr1`)** on 2026-11-11, matching the database. No international transfer for server-side processing.
- **Order-page tokens in analytics** — redacted before Vercel Analytics and Speed Insights see them (`RedactedAnalytics`). They **are** still in Vercel's request logs, kept 1 hour — see K3.
- **Cloudflare Turnstile** — strictly necessary per Cloudflare's own addendum (K4).
- **Behold** — serves the Instagram images itself; Meta sees no visitor IPs (K5).
- **Marketing sync respects unsubscribes** — verified end to end on 2026-11-09 (8API.3).

## 1. Who you are

Needed by all three documents:

- Business **legal name**, **trading name**, **postal address**
- **Contact email** for data requests and complaints
- ICO registration number, if the fee applies (K1)
- **Business structure** (limited company or sole trader) — either way, 6 years covers HMRC record-keeping (D1)

## 2. Personal data collected

| Data | Where | Why | Kept for (today) |
| --- | --- | --- | --- |
| **Email address** | `orders` — **Supabase, London (eu-west-2)** | Delivering tickets and the order page; resends | **Indefinitely today.** Proposed: **anonymised 12 months after the event** (pending the accountant, D1); enforced by C4 |
| **Order details** — tiers, quantities, prices, status, timestamps | `orders`, `order_items` | The sale, accounting, door validation | Indefinitely today → **6 years** (D1, C4) |
| **Ticket codes and status** (valid / used / voided) | `tickets` | Admission and scanning | Indefinitely today → **6 years** (D1, C4) |
| **Order access token** | `orders.access_token` | The private order-page link | As the order |
| **SumUp checkout id** | `orders.provider_session_id` | Matching payments | As the order |
| **Marketing consent** — yes/no and when | `orders.marketing_opt_in`, `created_at`, `marketing_synced_at` | Evidence of consent | As the order |
| **IP address + time of each checkout attempt** | `reservation_attempts` | Rate limiting / bot protection | **~10 minutes**, deleted when the next checkout attempt runs after that — can persist longer on a quiet site (C2) |
| **Card details** | **Never reach C58** — entered on SumUp's hosted page | Payment | SumUp's responsibility |

**Not collected from buyers:** names, phone numbers, postal addresses, dates of birth. No user accounts.

**People featured on the site** (D8): team members, volunteers and talent have **names, photos and bios** stored in Sanity and published publicly — personal data of those people, separate from buyers.

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
| **Sanity** (processor) | Site content, **including featured people's names, photos and bios** (D8); visitors' browsers fetch **hero background videos** straight from `cdn.sanity.io`, so Sanity sees their **IP addresses** (images go via Vercel); **no cookies**; editors have Sanity accounts | CMS — legitimate interests (Art. 6(1)(f)) | Transfers: SCCs + UK Addendum (K6); region unconfirmed |
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

> **Status: to be made dormant (C6).** Today the checkbox is **live** — ticks are recorded in `orders.marketing_opt_in`, but nothing reaches Brevo (the sync, PR #56, isn't merged). C6 hides the checkbox and blocks the sync until ICO registration (K1) and the privacy policy are done; then it's switched on.

- **Consent:** an **unticked** checkbox at checkout — *"Keep me posted about future C58 events and news."* — stored word for word with each contact (`lib/marketingOptIn.ts`)
- **Who's added:** buyers of **paid** orders who ticked it — abandoned checkouts never are
- **Evidence:** the order row, plus Brevo attributes for source, UK date, wording, order and last event
- **Unsubscribing:** Brevo's link in each campaign. **An unsubscribe always wins**, even if the person ticks the box again on a later purchase (D7)
- **Content (D3):** marketing and news only — upcoming events and pop-ups, news about DJs C58 is working with or whose house DJs are playing notable events, and where the business is going. **No partner offers** (would need new consent wording). Frequency not yet set

## 6. Ticket terms and conditions

- **Contract:** formed when payment succeeds; tickets delivered **by email and on the order page**
- **Cancellation rights:** UK consumer law generally gives **no 14-day cancellation right for event tickets for a specific date** (leisure-services exemption) — say so explicitly
- **Refunds (D4):** **cancelled → full refund**; **postponed → valid for the new date, refund on request within a set window**; **headline act pulls out and the event is materially different → refund**; **minor line-up changes → no refund**; **change of mind → no refund**. A `refunded` status exists; no refund process is built
- **Admission (D5):** **18+ with ID**; one entry per QR code — **first scan only** (the Milestone 9 door scanner enforces it); right to refuse entry; conduct rules; **re-entry as stated on the event page**
- **Tickets are bearer tickets (D6):** whoever holds a valid ticket can use it; transfers and resale are the holder's business. The buyer is **responsible for keeping tickets secure** (don't post them or show the QR publicly); **C58 isn't responsible for tickets bought from anyone else**
- **Lost tickets:** the email can be resent (order-page link; resend form 8UI.3 when built)
- **Price:** the total shown is the total charged — **no booking fee**; **not VAT-registered** (K2)
- **Sale windows:** tiers can have start/end times — not enforced until C5
- Liability limits, **governing law (England and Wales)**, complaints contact
