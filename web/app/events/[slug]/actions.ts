'use server'

import { z } from 'zod'
import { getEventDetailsById } from '@/sanity/fetch'
import { reserveOrder } from '@/lib/reserveOrder'

const OrderItemSchema = z.object({
	tierKey: z.string().min(1),
	quantity: z.number().int().positive(),
})

const CreateOrderSchema = z.object({
	eventDetailsId: z.string().min(1),
	items: z.array(OrderItemSchema).min(1, 'Select at least one ticket'),
	email: z.string().email('Enter a valid email address'),
	marketingOptIn: z.boolean(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export interface CreateOrderState {
	status: 'idle' | 'invalid' | 'unavailable' | 'sold_out' | 'reserved'
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
		case 'reserved':
			// TODO(7API.3): create the SumUp checkout session and redirect there
			// with result.orderId. Until then, the reservation is real (holds
			// the seats for 30 min) but there's nowhere to actually pay yet.
			return {
				status: 'reserved',
				message: "Your tickets are reserved — checkout isn't live yet, we'll be in touch shortly.",
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
	}
}
