-- Deliberately no policies. RLS with zero policies denies all access to
-- every role except the table owner — which is exactly the role our direct
-- Postgres connection (DATABASE_POOLED_URL) already uses, so this has no
-- effect on the app's current access pattern. It's a fail-safe default: if
-- the project's Data API is ever enabled later without anyone adding
-- policies first, these tables stay locked down instead of defaulting open.
alter table orders enable row level security;
alter table order_items enable row level security;
alter table tickets enable row level security;
