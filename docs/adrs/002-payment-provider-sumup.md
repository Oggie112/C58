# ADR 002 — Payment Provider: SumUp

**Date:** 2026-09-15
**Status:** Accepted

## Context

Online ticket sales need a checkout provider. `sale-architecture.md` considered SumUp and Stripe throughout without settling on one. SumUp is already in use for bar/door takings at C58 events.

## Decision

Use SumUp for online ticket checkout, to start. One settlement account and one dashboard covers bar, door, and online takings for a night — simpler reconciliation than splitting across two providers. No known blockers to using SumUp's hosted checkout for this flow.

If integration issues turn out to be insurmountable, switch to Stripe — considered unlikely, not expected to be needed.

## Consequences

- Checkout session creation, webhook verification (`checkout.session.completed` equivalent), and payment status checks are built against SumUp's API specifically — not abstracted behind a provider-agnostic interface for v1, since a second provider isn't currently expected.
- A future switch to Stripe would mean rebuilding the checkout-session and webhook-handling code in [ticketing roadmap Milestone 7](../roadmaps/ticketing.md#m7), not a config change.
- Reconciliation (bar + door + online) stays in one SumUp dashboard.
