create table reservation_attempts (
	id uuid primary key default gen_random_uuid(),
	ip_address text not null,
	created_at timestamptz not null default now()
);

create index reservation_attempts_ip_created_idx on reservation_attempts (ip_address, created_at);
