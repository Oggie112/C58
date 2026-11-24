-- Ticket resends requested through the /orders form (8UI.3).
--
-- resend_requested_at — a queued request: set when the buyer asks, cleared
--   once the email is sent. A failed send (Brevo quota, outage) restores it,
--   so the hourly retry picks it up — a resend is never silently dropped.
-- last_resent_at — when a resend was last sent; a new request for the order
--   is ignored within 30 minutes of it, so the form can't flood an inbox.
--
-- Unrelated to confirmation_sent_at, the first confirmation's claim.
alter table orders
	add column resend_requested_at timestamptz,
	add column last_resent_at timestamptz;

-- Emails are stored as the buyer typed them; the form matches regardless of
-- case, which the existing orders_email_idx can't serve
create index orders_email_lower_idx on orders (lower(email));

-- The retry scans only queued requests
create index orders_resend_requested_idx on orders (resend_requested_at)
	where resend_requested_at is not null;
