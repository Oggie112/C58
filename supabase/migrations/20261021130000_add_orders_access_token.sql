-- Secret for the buyer-facing order page (/orders/[token]). The page shows
-- the order's tickets, so its URL is effectively the tickets themselves —
-- hence a separate random value rather than orders.id, which is exposed as
-- SumUp's checkout_reference and in the checkout description. Generated in
-- app code (lib/reserveOrder.ts), not as a column default, since a
-- gen_random_bytes default would need pgcrypto.
--
-- Nullable: orders created before this column (sandbox test data only)
-- simply have no order page. Unique also gives the lookup its index.
alter table orders add column access_token text unique;
