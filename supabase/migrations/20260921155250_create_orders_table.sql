create table orders (
	id uuid primary key default gen_random_uuid(),
	event_id text not null, -- Sanity eventDetails document _id (holds the tiers being sold)
	provider text not null, -- 'sumup' (per ADR 002)
	provider_session_id text not null unique,
	email text not null,
	marketing_opt_in boolean not null default false,
	amount_total integer not null, -- pence
	status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
	created_at timestamptz not null default now()
);

create index orders_event_status_idx on orders (event_id, status);
create index orders_email_idx on orders (email);
