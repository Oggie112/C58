-- Reservation (7API.2) creates the orders row before any SumUp checkout
-- session exists (7API.3 assigns provider_session_id afterward via UPDATE).
-- Multiple NULLs don't conflict under a unique constraint, so many
-- un-checked-out pending orders at once is fine.
alter table orders alter column provider_session_id drop not null;
