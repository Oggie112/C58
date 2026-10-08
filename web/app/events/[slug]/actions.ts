'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getEventDetailsById } from '@/sanity/fetch'
import { reserveOrder } from '@/lib/reserveOrder'
import { createCheckoutSession } from '@/lib/sumup'
import { attachCheckoutSession } from '@/lib/attachCheckoutSession'
import { failReservation } from '@/lib/failReservation'
import { PER_ORDER_MAX } from '@/lib/orderLimits'

const OrderItemSchema = z.object({
	tierKey: z.string().min(1),
	// Same constant the UI's +/- buttons are capped by — a direct-POST
	// bypass of the UI must never be allowed more per tier than the UI
	// itself permits.
	quantity: z.number().int().positive().max(PER_ORDER_MAX),
})

const CreateOrderSchema = z.object({
	eventDetailsId: z.string().min(1),
	items: z
		.array(OrderItemSchema)
		.min(1, 'Select at least one ticket')
		// Generous backstop against an absurdly large array, not the real
		// defense — a legitimate order never has more entries than the
		// event has tiers. The real defense is the uniqueness check below:
		// without it, a per-item quantity cap means nothing, since any
		// total can be reassembled by repeating the same tierKey across
		// multiple entries.
		.max(20)
		.refine(
			(items) => new Set(items.map((item) => item.tierKey)).size === items.length,
			'Each tier can only appear once per order',
		),
	email: z.string().email('Enter a valid email address'),
	marketingOptIn: z.boolean(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export interface CreateOrderState {
	status: 'idle' | 'invalid' | 'unavailable' | 'sold_out' | 'checkout_failed'
	message?: string
}

export async function createOrder(
	_prevState: CreateOrderState,
	input: CreateOrderInput,
): Promise<CreateOrderState> {
	const parsed = CreateOrderSchema.safeParse(input)

	if (!parsed.success) {
		return {
			status: 'invalid',
			message: parsed.error.issues[0]?.message ?? 'Check your details and try again.',
		}
	}

	const eventDetails = await getEventDetailsById(parsed.data.eventDetailsId)
	if (!eventDetails?.tiers?.length) {
		return {
			status: 'invalid',
			message: 'This event no longer has ticket tiers available.',
		}
	}

	const result = await reserveOrder(parsed.data, eventDetails.tiers)

	switch (result.status) {
		case 'reserved': {
			let session
			try {
				session = await createCheckoutSession(result.orderId, result.amountTotal, `C58 order ${result.orderId}`)
			} catch (error) {
				console.error('Failed to create SumUp checkout session:', error)
				await failReservation(result.orderId)
				return {
					status: 'checkout_failed',
					message: "Something went wrong starting checkout. You haven't been charged — please try again.",
				}
			}

			await attachCheckoutSession(result.orderId, session.id)
			// redirect() throws internally — must stay outside the try/catch
			// above, or the catch would swallow the navigation as an error.
			redirect(session.hostedCheckoutUrl)
		}
		case 'sold_out':
			return {
				status: 'sold_out',
				message: 'Sorry, one of the tiers you selected just sold out. Please try again.',
			}
		case 'tier_not_open':
			return {
				status: 'sold_out',
				message: "One of the selected tiers isn't open yet.",
			}
		case 'invalid_tier':
			return {
				status: 'invalid',
				message: 'One of the selected tiers is no longer available.',
			}
	}
}
