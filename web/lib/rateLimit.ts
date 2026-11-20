import { sql } from './db'

const WINDOW_MINUTES = 10
// Generous on purpose — a real burst of simultaneous genuine buyers (a
// shared office/venue WiFi, a popular on-sale moment) should never trip
// this; it's aimed at obvious scripted floods, with Turnstile as the
// actual gate once it's crossed, not a hard block.
const MAX_ATTEMPTS_PER_WINDOW = 5

export async function checkRateLimit(ipAddress: string): Promise<{ limited: boolean }> {
	const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

	// Opportunistic cleanup. The guarantee comes from pg_cron, which deletes
	// these every 5 minutes (compliance C2) so stored IPs don't outlive the
	// window on a quiet site; this keeps the table small wherever it's absent
	// (the Testcontainers database). The count below filters by time anyway.
	await sql`delete from reservation_attempts where created_at < ${cutoff}`

	const [{ count }] = await sql<{ count: number }[]>`
		select count(*)::int as count from reservation_attempts
		where ip_address = ${ipAddress} and created_at >= ${cutoff}
	`

	// Recorded regardless of outcome — a request that gets challenged still
	// counts, otherwise repeatedly failing the challenge would never itself
	// exhaust the window.
	await sql`insert into reservation_attempts (ip_address) values (${ipAddress})`

	return { limited: count >= MAX_ATTEMPTS_PER_WINDOW }
}
