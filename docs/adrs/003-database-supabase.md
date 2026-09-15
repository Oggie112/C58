# ADR 003 — Database: Supabase

**Date:** 2026-09-15
**Status:** Accepted

## Context

Sanity holds event/ticketing *content* but deliberately never live inventory — orders, order items, and individual ticket rows need a proper database as the source of truth (`sale-architecture.md` §2). `sale-architecture.md` named Supabase, Neon, and PlanetScale as interchangeable options. Worth noting for the record: PlanetScale dropped Postgres support and is MySQL-only now, so it was never actually a like-for-like option against the other two.

## Decision

Supabase. Mature product, generous free tier, and prior working familiarity — no reason to spend evaluation time on Neon when Supabase already covers the requirement.

## Consequences

- Standard Postgres — the schema in `sale-architecture.md` §2 (`orders`, `order_items`, `tickets`) and the transactional locking logic in §2's Reservation/capacity locking section apply unchanged.
- Supabase's free tier pauses a project after a period of inactivity (currently ~1 week with no API requests) and requires a manual unpause. For a business with irregular release days, this is worth a calendar reminder or a lightweight keep-alive once the release cadence is known — flagged as an operational watch-item for [Milestone 6](../roadmaps/ticketing.md#m6), not a blocker.
- Supabase also offers auth/storage/realtime beyond plain Postgres — not needed for v1 (door-scanner auth is still TBD, see Milestone 9), but available without a second vendor if a future need arises.
