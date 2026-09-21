# ADR 004 — Event Detail Content Model: `eventDetails` Referenced From `event`

**Date:** 2026-09-15
**Status:** Accepted

## Context

`event.ts` today is listing-card-oriented — `title`, `slug`, `date`, `time`, `location`, `cost`, `ticketUrl`, `image`, `description` — consumed by `EventCard`, `EventListBlock`, and `NextEventBlock`. No event detail page exists yet; `ticketUrl` currently sends buyers off-site.

`sale-architecture.md` framed the choice as (A) a thin `ticketing` doc (just tiers + status) vs. (B) a fuller `eventPage` doc owning "the whole detail-page experience," undecided pending a look at `event.ts` and the detail page's actual content ambition.

Both were resolved in discussion:
- The new doc must **reference** `event`, not duplicate its fields (`title`/`slug`/`date`/`image`) — duplication means editing two records to keep one event in sync, real drift risk for a non-technical editor (the whole premise of [ADR 001](001-initial-tech-stack.md)).
- The detail page's content ambition is a proper event landing page, not just ticketing bolted onto the existing card fields — confirmed: line-up and FAQ content wanted alongside ticket tiers.

## Decision

New `eventDetails` document type, one-to-one referenced from `event` (`eventDetails.event -> event`, required, unique per event). Holds:

- `tiers` — array of ticket tier objects (`name`, `price` in pounds — not pence as originally sketched in `sale-architecture.md` §1; editors shouldn't have to convert pence in their heads, so the conversion to integer pence happens once at the Milestone 7 fetch boundary instead — `capacity`, `releaseTrigger`, `saleStart`, `saleEnd`, `description`)
- `ticketingStatus` — manual override (`not_open` / `on_sale` / `sold_out` / `closed`)
- `lineup` — array of entries (name at minimum; room for role/image/set time as the content need becomes clearer)
- `faq` — array of question/answer objects
- Extended body content for the detail page, kept separate from `event.description` (which stays the shorter listing-card summary)

`event.ts` is not modified. `EventCard`, `EventListBlock`, and `NextEventBlock` are unaffected — they keep querying `event` alone.

## Consequences

- Two Sanity documents per ticketed event, but no field overlap between them — `event` owns listing identity, `eventDetails` owns everything detail-page-and-ticketing-specific. Client edits the right one for the right job rather than reconciling duplicated fields.
- Studio UX needs attention so the two-document relationship doesn't get lost on a non-technical editor — surfacing `eventDetails` inline under its `event` (desk structure / structure builder), rather than as a flat, easy-to-miss second list, is a follow-up task under [Milestone 6](../roadmaps/ticketing.md#m6), not solved by the schema alone.
- The event detail page query does one extra join (`event` → `eventDetails`) beyond what listing queries need — listing-page GROQ queries are untouched.
- Extending `eventDetails` further later (more FAQ-like sections, richer line-up fields) is additive — no migration, since it was never merged into `event` in the first place.
