-- Hourly retry of paid-order follow-ups (confirmation emails, marketing-list
-- sync) from inside the database — roadmap 8API.6. GitHub's scheduled
-- workflow ran only ~3–4 times a day and is disabled after 60 days without
-- repository activity; it stays as a daily watchdog that emails on failure.
--
-- pg_net is fire-and-forget: the cron run "succeeds" once the request is
-- queued, whatever the endpoint answers. Responses are kept in
-- net._http_response for ~6 hours (see the README for the query).
--
-- The CRON_SECRET is never in this file (the repo is public). Create it once,
-- in the SQL editor, before the first run:
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
-- Without it the request is sent with no valid Authorization header and the
-- endpoint answers 401.
--
-- Timeout set explicitly: pg_net's default is a few seconds (2s or 5s by
-- version), and a run can send up to 20 emails at ~1s each.
--
-- Guarded like 20261120120000: the Testcontainers database has neither
-- pg_cron nor pg_net. cron.schedule() with a job name replaces an existing
-- job of that name.
do $$
begin
	if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
		or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
		raise notice 'pg_cron or pg_net not available — skipping the follow-up retry schedule';
		return;
	end if;

	create extension if not exists pg_cron;
	create extension if not exists pg_net;

	-- Hourly at :17, as the GitHub workflow was. www: the apex redirects.
	perform cron.schedule(
		'retry-paid-order-follow-ups',
		'17 * * * *',
		$job$
		select net.http_post(
			url := 'https://www.c58.uk/api/cron/retry-confirmations',
			headers := jsonb_build_object(
				'Content-Type', 'application/json',
				'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
			),
			timeout_milliseconds := 60000
		)
		$job$
	);
end
$$;
