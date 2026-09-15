# C58 Ticket Sales — Architecture Sketch

## 1. Sanity schema — document shape not yet finalized

Original sketch below assumed ticket tiers get added straight into the existing `event.ts` document. That's now off the table: `event.ts` is already consumed by `eventList` and other listing-page areas, so adding ticketing fields to it would leak ticketing data into every consumer that just needs a listing card.

**Two options on the table, decision pending:**

- **(A) Separate `ticketing` document**, referenced from `event` — a thin doc holding just `tiers` + `ticketingStatus`, joined in via GROQ only on the event detail page query. Smaller, more surgical change; `event.ts` and all existing `eventList` consumers stay untouched.
- **(B) A fuller `eventPage` document** that owns the whole detail-page experience — full description, lineup, ticket tiers, FAQ, etc. — separate from the lightweight `event` used for listings. Bigger change, but more honest if the event detail page was always going to need more editorial content than `event.ts` currently holds, with ticketing just being the trigger to finally build it out properly.

**Currently leaning toward (B)**, on the basis that the detail page likely needs building out beyond just ticketing anyway — but this is genuinely undecided pending a look at what `event.ts` currently holds (list-card-only vs. already fuller) and how much extra editorial content the detail page is expected to carry. Worth settling before committing to either schema, since migrating from A to B later means moving fields, not just adding them.

The schema example below is the original single-document sketch (now outdated re: document split) — kept for reference on the *field-level* shape (tier structure, pence-based pricing, etc.), which holds regardless of which document it ends up living in.

```js
// schemas/event.js — NOTE: ticketing fields below should NOT land directly in the
// real event.ts; see the A/B decision above. Shown here for field-shape reference only.
export default {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', validation: R => R.required() },
    { name: 'slug', type: 'slug', options: { source: 'title' }, validation: R => R.required() },
    { name: 'date', type: 'datetime', validation: R => R.required() },
    { name: 'venue', type: 'string' },
    { name: 'description', type: 'array', of: [{ type: 'block' }] },
    { name: 'coverImage', type: 'image', options: { hotspot: true } },
    { name: 'lineup', type: 'array', of: [{ type: 'string' }] },
    {
      name: 'ticketTiers',
      title: 'Ticket Tiers',
      type: 'array',
      of: [{
        type: 'object',
        name: 'tier',
        fields: [
          { name: 'name', type: 'string', validation: R => R.required() }, // "First release", "VIP"
          { name: 'price', type: 'number', validation: R => R.required() }, // pence, to avoid float issues
          { name: 'capacity', type: 'number', validation: R => R.required() },
          { name: 'saleStart', type: 'datetime' },
          { name: 'saleEnd', type: 'datetime' },
          { name: 'description', type: 'text' },
        ],
      }],
    },
    {
      name: 'ticketingStatus',
      type: 'string',
      options: { list: ['not_open', 'on_sale', 'sold_out', 'closed'] },
      initialValue: 'not_open',
    },
  ],
}
```

Notes:
- Store `price` in pence/cents — avoids the classic float rounding bug when summing tiers.
- `ticketingStatus` is a manual override switch (e.g. force "sold_out" even if capacity isn't technically hit, for door-only overflow nights).
- Sanity does **not** know how many tickets have actually sold — that number lives in your own DB (below), not Sanity. Sanity is content or event *config*, never live inventory count. Your event page fetches tiers from Sanity, but checks remaining capacity against your DB at request time.


## 2. Database (source of truth for orders/tickets/inventory)

Doesn't need to be heavy — Postgres via something like Supabase/Neon/PlanetScale is plenty. Three tables:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,              -- Sanity document _id
  provider text not null,              -- 'sumup' | 'stripe'
  provider_session_id text not null,   -- checkout id from provider
  email text not null,
  marketing_opt_in boolean not null default false,
  amount_total integer not null,       -- pence
  status text not null default 'pending', -- pending | paid | failed | refunded
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  tier_name text not null,
  unit_price integer not null,
  quantity integer not null
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id),
  ticket_code text unique not null,    -- e.g. C58-XXXXXXXX, what the QR encodes
  status text not null default 'valid', -- valid | used | voided
  scanned_at timestamptz
);
```

One row per **admission**, not per order — so a purchase of 3 GA tickets creates 3 `tickets` rows, each independently scannable at the door. This is what actually stops one QR code getting shared/reused for group entry.

Capacity check on the event page: `sold = count(tickets) join order_items join orders where event_id = X and status = 'paid'`, compared against Sanity's `capacity` for that tier.

### Reservation / capacity locking

A `pending` order reserves seats the moment checkout starts, so two buyers can't both grab the last spot in a tier — but a reservation that's abandoned (tab closed, session timed out) must eventually free those seats back up, or the tier looks sold out when it isn't.

- When computing remaining stock, only count `pending` orders **younger than the provider's checkout session window** (SumUp's hosted checkout expires after 30 minutes) as reserved. Older `pending` rows are treated as abandoned and excluded — no cleanup job needed, just `created_at > now() - interval '30 minutes'` in the query.
- The check-and-reserve has to happen as one atomic step, not two: two people can both fetch the page seeing "1 left," then both try to buy. Wrap the "is there still stock?" check and the `pending` order insert in a single DB transaction (row lock or a `capacity - sold - pending >= requested` guard inside the transaction) so only one of them succeeds. Fine to do at C58's scale — no need for anything fancier than Postgres' own transaction guarantees.
- `paid` (from the webhook) is the only status that permanently consumes a seat. `pending` is a soft, time-limited hold; `failed`/abandoned sessions just age out of the count.

## 3. Purchase flow

1. Event page fetches event + tiers from Sanity, sold + reserved counts from your DB (per the locking logic above), computes remaining stock per tier.
2. Customer picks quantities, enters email, ticks (or leaves unticked) the marketing opt-in checkbox — this is **your own checkbox**, not the provider's, so wording and default state are entirely under your control.
3. Your backend, in one transaction, re-checks stock and creates an `orders` row (`status: pending`) — then creates a checkout session with SumUp (or Stripe), passing `order.id` as the `checkout_reference` / metadata so the webhook can match it back.
4. Redirect customer to the hosted checkout page.
5. Webhook (`checkout.session.completed` / SumUp's equivalent) fires:
   - Verify payment status via the API (don't trust the redirect alone)
   - Mark `orders.status = 'paid'`
   - Generate one `tickets` row per unit purchased, each with a unique `ticket_code`
   - Kick off the confirmation email (below)
   - If `marketing_opt_in = true`, push the email to your mailing list provider

## 4. Email provider — Brevo (mailing list + confirmation, one account)

Decided against splitting transactional (Resend) and marketing (Brevo) across two providers. The usual reason for that split — a marketing bounce/complaint tanking your ability to deliver transactional mail — is a real risk at scale, but not a load-bearing concern for C58's size and send frequency. One account/API key is simpler to run, and Brevo's transactional endpoints do the same job:

- **Confirmation email**: `POST` to Brevo's transactional email API (same `api-key` header auth as the contacts API)
- **Mailing list opt-in**: `POST /v3/contacts` — same account, same call pattern as before, just no separate provider

**Free tier limit**: 300 emails/day, shared across transactional *and* campaign sends, resets midnight UTC. Important nuance vs. some other providers: if you go over on transactional, Brevo **queues up to 1,000 additional emails for retry** rather than dropping them outright — so a busy release day delays confirmations, it doesn't lose them.

**Staying under the cap in practice**:
- Send event-announcement campaigns a few days *before* release date, not on release day itself — keeps that day's quota clear for confirmations
- Don't schedule any marketing campaign on a release day
- If a release day's confirmation volume alone could realistically approach 300 (a very popular sellout), that's the trigger to upgrade to Brevo Starter (~$9/mo, removes the daily cap) rather than relying on the retry queue

**Confirmation timing expectation**: given the retry queue, don't promise instant delivery. Set the expectation as **"ticket confirmation may take up to 24 hours"** on the post-payment screen — cheap to add, and removes the pressure to over-engineer send throttling. Pair this with a self-serve order-status view (see below) so a delayed email doesn't turn into a "did my payment even go through?" support query.

```js
// on webhook, after tickets are created
import QRCode from 'qrcode';

const qrImages = await Promise.all(
  tickets.map(t => QRCode.toDataURL(t.ticket_code)) // encodes just the code — validation happens server-side against the DB
);

await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'api-key': BREVO_API_KEY },
  body: JSON.stringify({
    to: [{ email: order.email }],
    subject: `Your tickets for ${event.title}`,
    htmlContent: renderTicketEmail({ event, tickets, qrImages }),
  }),
});
```

- Attach or inline each QR as an image per ticket if it's a multi-ticket order — one scan per person.
- Door scanning: a simple phone-camera + browser QR reader (e.g. `html5-qrcode`) hitting an endpoint that checks `status = 'valid'`, flips it to `used`, stamps `scanned_at`. Reject/flag anything already `used` — that's your double-entry protection, not the QR image.

### Self-serve order status

A simple page keyed off order ID (or email + event) showing ticket status without depending on the confirmation email having arrived — covers the gap during the up-to-24h delivery window and doubles as a "lost my email" recovery path later.

## 5. Mailing list push

Same account as confirmation email, only if opted in:

```js
if (order.marketing_opt_in) {
  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({ email: order.email, listIds: [YOUR_LIST_ID], updateEnabled: true }),
  });
}
```

Keep this a non-blocking, best-effort call (log failures, don't fail the whole webhook if it hiccups) — the ticket purchase and confirmation email must never depend on the marketing-list call succeeding.

## 6. Refunds — full order only (v1)

Deliberately no partial-refund path for now: cancelling 1 of 3 tickets in an order still requires proportional refund math (you can't refund the full `amount_total` for a partial cancellation), so it isn't actually simpler than doing full refunds properly — it just adds reissuing codes on top. Ship the simple version first, add partial refunds later only if it's actually requested in practice.

Flow: refund trigger (manual, from an admin view or just direct DB/dashboard action for now) →
- Void every `tickets` row on the order (`status = 'voided'`) — a voided ticket must be rejected at the door scanner the same as a used one
- Call the provider's refund API for the order's full `amount_total`
- Mark `orders.status = 'refunded'`
- No new tickets, no reissue email — the customer just no longer has valid tickets

## Services in play

Sanity (content) → SumUp or Stripe (payment) → Postgres (orders/tickets, source of truth) → Brevo (mailing list + confirmation email, one account). SumUp is already in use for bar/door, making it the leaning choice for online payment too — one settlement account, one dashboard for reconciling a night's full takings.