-- Mirrors ticket-tier capacity from Sanity (kept in sync by the
-- sanity-tiers webhook), so the atomic reservation check has a real row to
-- conditionally UPDATE against — capacity itself has no other home in this
-- database. `reserved` counts both pending and paid units currently
-- committed against a tier; see lib/reserveOrder.ts and
-- lib/sweepStaleReservations.ts for how it's kept accurate.
create table tiers (
	event_id text not null,
	tier_key text not null,
	capacity integer not null check (capacity >= 0),
	reserved integer not null default 0 check (reserved >= 0 and reserved <= capacity),
	primary key (event_id, tier_key)
);
