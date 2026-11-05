-- When the order-confirmation email (tickets + order-page link) was sent via
-- Brevo. Doubles as the send's atomic claim (lib/sendOrderConfirmation.ts):
-- set before sending with a conditional UPDATE ... WHERE confirmation_sent_at
-- IS NULL, so concurrent triggers (SumUp webhook, order page) send at most
-- once, and reset to null if Brevo rejects the send so the next trigger
-- retries it. Null on a paid order means "not yet sent".
alter table orders add column confirmation_sent_at timestamptz;

-- Orders paid before this column existed are sandbox test data. Mark them as
-- handled so the first visit to one of their order pages after deploy doesn't
-- send a confirmation for a weeks-old test purchase.
update orders set confirmation_sent_at = created_at where status = 'paid';
