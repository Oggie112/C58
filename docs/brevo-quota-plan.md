# Brevo Email Quota Plan

How C58 stays inside Brevo's sending limit, and when to pay for more. Roadmap item 8DX.1 ([ticketing roadmap](roadmaps/ticketing.md)).

## The limit

| | |
| --- | --- |
| Plan | **Free** (confirmed via the API, 2026-11-03) |
| Allowance | **300 emails per day**, reset daily; unused sends don't carry over ([Brevo FAQ](https://help.brevo.com/hc/en-us/articles/208580669)) |
| What counts | Treat it as **one shared pool** for campaigns *and* transactional email. The account reports a single `sendLimit` of 300; Brevo's docs don't say transactional has a separate allowance |
| Per recipient | One email to one address = one send. A confirmation with 4 tickets is **one** send (the tickets are attachments) |

## What uses it

| Email | Sends | When |
| --- | --- | --- |
| Order confirmation (8API.1) | 1 per **paid order** | Spikes on release days |
| Resend from `/orders` (8UI.3, not yet built) | 1 per paid order for that address | Rare, buyer-triggered |
| Campaigns to the opt-in list | 1 per **contact on the list** | Whenever scheduled |
| Adding opt-in buyers to the list (8API.3) | **0** — a contacts API call, not an email | — |

## Why it matters

When the quota is used up, Brevo rejects further sends. A rejected confirmation is logged and released for retry (`lib/sendOrderConfirmation.ts`), but **it's only retried when the buyer reopens their order page** — SumUp doesn't re-send a webhook it already got a reply to. A buyer who paid, closed the tab and never clicked back to the site **gets no email, even after the quota resets.** Their tickets still exist (valid in the database, visible on the order page), but they have no link to it.

So the plan is mostly about never hitting the limit on a day people are buying.

## Rules

1. **Never send a campaign on a release day.** Schedule announcements **at least two days before** tickets go on sale, so the campaign's sends and the confirmations can't share a day's allowance.
2. **Daily budget: 250.** On any day, *campaign recipients + expected paid orders* must stay under 250, leaving 50 for resends, tests and surprises.
3. **Estimate orders from tickets, not hope.** Orders are never more than tickets sold, so the tickets you're releasing that day is a safe upper bound. If a release could sell more than 250 tickets in a day, assume it could exceed the budget.

## When to upgrade

Move to **Starter** — no daily cap; monthly allowance from 5,000 emails — when either:

- a single release could sell **more than ~200 tickets in a day**, or
- the opt-in list grows past **~250 contacts** (one campaign would no longer fit in a day's budget).

Starter is billed monthly, so it can be bought for the month of a big release and dropped afterwards. Third-party reviews put it at roughly **£6–19/month** depending on volume, and Starter emails carry a Brevo logo unless a removal add-on is bought; prices vary between sources, so **check brevo.com's UK pricing before buying**. Upgrading needs no code or env-var changes — the same API key and sender carry on.

## Monitoring

- **Brevo dashboard → Usage** shows the day's sends against the limit. Check it before scheduling a campaign and on release days.
- **Unsent confirmations** — paid orders whose email never went out (read-only, against the production database):

  ```sql
  select id, email, created_at
  from orders
  where status = 'paid' and confirmation_sent_at is null
  order by created_at;
  ```

  This should return nothing. Rows that stay there after a few minutes mean confirmations are failing — check the Vercel function logs for `confirmation email failed` (each line names the order id).

## If confirmations fail anyway

Once the quota resets (or after upgrading), affected buyers need a nudge to their order page, which retries the send on load. Until 8UI.3's resend form exists, there's no self-serve route — contact them from the business inbox using the email addresses from the query above, and ask them to reply if they need their tickets resent.

**Planned: an hourly automatic retry (roadmap 8API.4)** for paid orders still missing a confirmation. Once built, recovery after a reset or an outage needs no action. It **won't help a buyer caught by the quota on the day of the event** — their retry can't run until the reset, by which time the event may be over. Only staying inside the limit (the rules above) protects them.

## Review

Revisit this plan when moving off the Free plan, when the opt-in list passes ~250 contacts, or before the first release expected to sell 200+ tickets in a day.
