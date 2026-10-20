-- tiers and reservation_attempts predate the trigger that now enables RLS
-- automatically on new tables, so they were missed by it — same fail-safe
-- as the original enable_rls.sql: no policies, denies all access to every
-- role except the table owner (what DATABASE_POOLED_URL already connects
-- as), so this has no effect on the app's current access pattern.
alter table tiers enable row level security;
alter table reservation_attempts enable row level security;
