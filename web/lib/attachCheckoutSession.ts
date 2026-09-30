import { sql } from './db'

export async function attachCheckoutSession(orderId: string, providerSessionId: string): Promise<void> {
	await sql`update orders set provider_session_id = ${providerSessionId} where id = ${orderId}`
}
