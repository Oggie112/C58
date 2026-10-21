import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import type { CheckoutStatus } from './sumup'

jest.mock('./sumup', () => ({
	getCheckoutStatus: jest.fn(),
}))

// Committed alongside reserveOrder.concurrency.test.ts for the same reason:
// confirmOrder is the step that turns money into admissions, shared by the
// webhook and the order page, so double-issuing or failing to release stock
// here is a correctness bug, not a cosmetic one.
describe('confirmOrder', () => {
	let container: StartedPostgreSqlContainer
	let sql: typeof import('./db').sql
	let confirmOrder: typeof import('./confirmOrder').confirmOrder
	let getCheckoutStatus: jest.MockedFunction<(checkoutId: string) => Promise<CheckoutStatus>>

	const eventId = 'confirm-order-test-event'

	beforeAll(async () => {
		container = await new PostgreSqlContainer('postgres:16').start()
		process.env.DATABASE_POOLED_URL = container.getConnectionUri()

		// lib/db.ts reads DATABASE_POOLED_URL at module-load time — imported
		// dynamically, after the env var above is set.
		;({ sql } = await import('./db'))
		;({ confirmOrder } = await import('./confirmOrder'))
		getCheckoutStatus = (await import('./sumup')).getCheckoutStatus as typeof getCheckoutStatus

		const migrationsDir = path.resolve(__dirname, '../../supabase/migrations')
		const migrationFiles = fs
			.readdirSync(migrationsDir)
			.filter((file) => file.endsWith('.sql'))
			.sort()
		for (const file of migrationFiles) {
			await sql.file(path.join(migrationsDir, file))
		}

		await sql`insert into tiers (event_id, tier_key, capacity, reserved) values (${eventId}, 'ga', 100, 0), (${eventId}, 'vip', 100, 0)`
	}, 60_000)

	afterAll(async () => {
		await sql.end()
		await container.stop()
	})

	// A pending order holding `ga` x2 and `vip` x1, with tiers.reserved
	// incremented to match — the state reserveOrder leaves behind.
	async function seedPendingOrder() {
		const providerSessionId = randomUUID()
		const [order] = await sql<{ id: string }[]>`
			insert into orders (event_id, provider, provider_session_id, email, amount_total, status)
			values (${eventId}, 'sumup', ${providerSessionId}, 'buyer@example.com', 5000, 'pending')
			returning id
		`
		await sql`
			insert into order_items (order_id, tier_key, tier_name, unit_price, quantity)
			values (${order.id}, 'ga', 'General Admission', 1500, 2), (${order.id}, 'vip', 'VIP', 2000, 1)
		`
		await sql`update tiers set reserved = reserved + 2 where event_id = ${eventId} and tier_key = 'ga'`
		await sql`update tiers set reserved = reserved + 1 where event_id = ${eventId} and tier_key = 'vip'`
		return { id: order.id, providerSessionId }
	}

	async function orderState(orderId: string) {
		const [{ status }] = await sql<{ status: string }[]>`select status from orders where id = ${orderId}`
		const [{ count }] = await sql<{ count: number }[]>`
			select count(*)::int as count from tickets
			join order_items on order_items.id = tickets.order_item_id
			where order_items.order_id = ${orderId}
		`
		return { status, ticketCount: count }
	}

	async function reservedTotal() {
		const [{ total }] = await sql<{ total: number }[]>`
			select sum(reserved)::int as total from tiers where event_id = ${eventId}
		`
		return total
	}

	beforeEach(() => {
		getCheckoutStatus.mockReset()
	})

	it('marks a PAID order paid and issues one ticket per admission across every line item', async () => {
		const order = await seedPendingOrder()
		getCheckoutStatus.mockResolvedValue('PAID')

		await expect(confirmOrder(order)).resolves.toBe('paid')

		expect(getCheckoutStatus).toHaveBeenCalledWith(order.providerSessionId)
		expect(await orderState(order.id)).toEqual({ status: 'paid', ticketCount: 3 })
	})

	it('is idempotent — confirming an already-paid order issues no further tickets', async () => {
		const order = await seedPendingOrder()
		getCheckoutStatus.mockResolvedValue('PAID')

		await confirmOrder(order)
		await expect(confirmOrder(order)).resolves.toBe('paid')

		expect(await orderState(order.id)).toEqual({ status: 'paid', ticketCount: 3 })
	})

	it('issues tickets exactly once when two confirmations race', async () => {
		const order = await seedPendingOrder()
		getCheckoutStatus.mockResolvedValue('PAID')

		await Promise.all([confirmOrder(order), confirmOrder(order)])

		expect(await orderState(order.id)).toEqual({ status: 'paid', ticketCount: 3 })
	})

	it.each(['FAILED', 'EXPIRED'] as const)('marks a %s order failed and releases its reserved stock', async (status) => {
		const order = await seedPendingOrder()
		const reservedBefore = await reservedTotal()
		getCheckoutStatus.mockResolvedValue(status)

		await expect(confirmOrder(order)).resolves.toBe('failed')

		expect(await orderState(order.id)).toEqual({ status: 'failed', ticketCount: 0 })
		expect(await reservedTotal()).toBe(reservedBefore - 3)
	})

	it('leaves a still-PENDING checkout untouched', async () => {
		const order = await seedPendingOrder()
		const reservedBefore = await reservedTotal()
		getCheckoutStatus.mockResolvedValue('PENDING')

		await expect(confirmOrder(order)).resolves.toBe('pending')

		expect(await orderState(order.id)).toEqual({ status: 'pending', ticketCount: 0 })
		expect(await reservedTotal()).toBe(reservedBefore)
	})

	it('propagates a SumUp lookup failure without touching the order', async () => {
		const order = await seedPendingOrder()
		getCheckoutStatus.mockRejectedValue(new Error('SumUp down'))

		await expect(confirmOrder(order)).rejects.toThrow('SumUp down')

		expect(await orderState(order.id)).toEqual({ status: 'pending', ticketCount: 0 })
	})
})
