-- Scheduled cleanup with pg_cron (compliance C2).
--
-- reservation_attempts holds an IP address per checkout attempt, only ever
-- needed for the rate limit's 10-minute window (lib/rateLimit.ts). Its own
-- cleanup runs only on the next attempt, so on a quiet site rows could sit
-- for days. This deletes them every 5 minutes instead, so none outlives
-- ~15 minutes — whatever the site's traffic.
--
-- pg_cron logs every run to cron.job_run_details and never prunes it, so a
-- second job keeps a week of history (as Supabase's Cron quickstart advises).
--
-- Guarded: the plain postgres image used by the Testcontainers suite has no
-- pg_cron, and every migration runs there too. cron.schedule() with a job
-- name replaces an existing job of that name, so re-running is harmless.
do $$
begin
	if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
		raise notice 'pg_cron not available — skipping scheduled cleanup';
		return;
	end if;

	create extension if not exists pg_cron;

	perform cron.schedule(
		'clean-up-reservation-attempts',
		'*/5 * * * *',
		$job$delete from public.reservation_attempts where created_at < now() - interval '10 minutes'$job$
	);

	perform cron.schedule(
		'clean-up-cron-history',
		'0 3 * * *',
		$job$delete from cron.job_run_details where end_time < now() - interval '7 days'$job$
	);
end
$$;
