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

When the quota is used up, Brevo rejects further sends. A rejected confirmation is logged and released for retry (`lib/sendOrderConfirmation.ts`), and an **hourly retry** (8API.4) sends it once Brevo accepts again — after the daily reset, or after an upgrade.

That's fine for a buyer whose event is days away. It's no help to someone buying **on the day of the event**: their retry can't succeed until the quota resets, by which time the event may be over. Their tickets still exist (valid in the database, visible on the order page if they clicked back from SumUp), but they may have no email to show at the door.

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

  This should return nothing for long: anything here is picked up by the next hourly retry.
- **The hourly retry alerts you.** The *Retry Confirmation Emails* GitHub Actions workflow fails — and GitHub emails the repo owner — whenever a send fails or the retry endpoint can't be reached. During a quota outage that's one email an hour until the reset.

## When the retry alert arrives

1. **Open the failed run** (GitHub → Actions → *Retry Confirmation Emails*). Its summary line — e.g. `found 12, sent 0, failed 3, stoppedEarly true` — gives the scale. `stoppedEarly` means three failures in a row: almost certainly account-wide (quota, outage, key) rather than one bad order. The log is public, so it holds counts only.
2. **Vercel → Logs**, search `confirmation email failed`. Each line names the order and Brevo's actual error — e.g. a credits/quota message, `401 … Key not found`, or a 5xx. That's the cause.
3. **Brevo dashboard:** *Usage* (quota used up?), *SMTP & API → API keys* (key expired or deactivated?), and Brevo's status page (outage?).
4. **Database:** the query above lists exactly which buyers are still waiting.
5. **Fix the cause** — wait for the reset, upgrade the plan, or renew the key — then either wait for the next hourly run or press **Run workflow** on the workflow to clear the backlog straight away.
6. **One order failing while others send** is probably a bad address: the Vercel line names it. It's retried (and logged) every hour without blocking the rest; contact that buyer another way.

**Same-day buyers** caught by quota won't be rescued by the retry in time (see above) — contact them from the business inbox, and ask them to open their order page from SumUp's "Back to merchant website" link if they still have it, or reply for help.

**Not covered by the retry:** an order whose send was interrupted mid-flight (the server crashed after claiming it) is marked as sent and won't appear in the query. It's rare; the resend form (8UI.3) will be the fallback.

## Review

Revisit this plan when moving off the Free plan, when the opt-in list passes ~250 contacts, or before the first release expected to sell 200+ tickets in a day.
