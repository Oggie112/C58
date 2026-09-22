create table tickets (
	id uuid primary key default gen_random_uuid(),
	order_item_id uuid not null references order_items (id),
	ticket_code text unique not null,
	status text not null default 'valid' check (status in ('valid', 'used', 'voided')),
	scanned_at timestamptz
);

create index tickets_order_item_id_idx on tickets (order_item_id);
