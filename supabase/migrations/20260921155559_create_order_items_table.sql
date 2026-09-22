create table order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references orders (id),
	tier_key text not null, -- Sanity tiers[]._key — stable even if the tier is later renamed
	tier_name text not null, -- snapshot of the tier's display name at purchase time
	unit_price integer not null, -- pence, snapshot at purchase time (Sanity price may change later)
	quantity integer not null check (quantity > 0)
);

create index order_items_order_id_idx on order_items (order_id);
