-- Latch for `previousSoldOut` tiers: set the first time the tier is found
-- open (its previous tier fully reserved), never cleared. Without it, a
-- tier opened by the last seats of the previous one going into an unpaid
-- hold would close again when the sweep releases those seats — buyers
-- mid-checkout on it would hit "tier not open", and cheaper seats would
-- reappear after others had already paid more. See lib/latchOpenTiers.ts.
-- Nullable: null means "not yet latched", which is every existing row.
alter table tiers add column opened_at timestamptz;
