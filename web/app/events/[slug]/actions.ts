'use server'

import { z } from 'zod'

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
	status: 'idle' | 'invalid' | 'unavailable'
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

	// TODO(7API.2/7API.3): atomic check-and-reserve against Supabase (orders,
	// order_items), then create a SumUp checkout session and redirect there.
	// Until that lands, this only validates the payload shape — no order is
	// created anywhere yet.
	return {
		status: 'unavailable',
		message: "Online ticketing isn't live yet — check back soon.",
	}
}
