-- When a paid, opted-in buyer was added to the Brevo marketing list (8API.3).
-- Same claim pattern as confirmation_sent_at: set before the Brevo call by a
-- conditional UPDATE ... WHERE marketing_synced_at IS NULL, so concurrent
-- triggers add a buyer at most once, and reset to null if Brevo rejects it so
-- the next trigger (or the hourly retry) tries again. Only meaningful when
-- status = 'paid' and marketing_opt_in = true; null otherwise.
alter table orders add column marketing_synced_at timestamptz;

-- Opted-in paid orders before this column are sandbox test data. Mark them as
-- handled so deploying this doesn't add test addresses to the marketing list.
update orders set marketing_synced_at = created_at where status = 'paid' and marketing_opt_in;
