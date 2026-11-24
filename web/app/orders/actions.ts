'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { clientIp } from '@/lib/clientIp'
import { requestTicketResend } from '@/lib/requestTicketResend'
import { sendTicketResend } from '@/lib/sendTicketResend'

const ResendTicketsSchema = z.object({
	email: z.email('Enter a valid email address'),
	// Only present once the visitor has been challenged and solved it
	turnstileToken: z.string().optional(),
})

export type ResendTicketsInput = z.infer<typeof ResendTicketsSchema>

export interface ResendTicketsState {
	status: 'idle' | 'invalid' | 'requested' | 'challenge_required'
	message?: string
}

// The same reply whatever the address — never says whether it has orders.
// Not exported: a 'use server' file may only export async functions.
const RESEND_REQUESTED_MESSAGE =
	"If we have paid orders for upcoming events at that address, we'll email the tickets again. It usually takes a few minutes, but can take up to 24 hours at busy times — check your spam folder too."

// The resend form (8UI.3): email in, tickets for that address's upcoming
// events resent, nothing displayed. Rate-limited like checkout (the same
// counter: 5 attempts per IP per 10 minutes, then a Turnstile challenge).
export async function resendTickets(_prevState: ResendTicketsState, input: ResendTicketsInput): Promise<ResendTicketsState> {
	const parsed = ResendTicketsSchema.safeParse(input)
	if (!parsed.success) {
		return { status: 'invalid', message: parsed.error.issues[0]?.message ?? 'Enter a valid email address' }
	}

	const ip = await clientIp()
	const { limited } = await checkRateLimit(ip)
	if (limited) {
		if (!parsed.data.turnstileToken) {
			// Logged so a stalled request is traceable — never the IP itself
			console.warn('resendTickets: rate limit reached — Turnstile challenge required')
			return { status: 'challenge_required' }
		}
		// verifyTurnstileToken logs its own rejection reason
		if (!(await verifyTurnstileToken(parsed.data.turnstileToken, ip))) {
			return { status: 'challenge_required' }
		}
	}

	// Looked up and sent after the reply: the response takes the same time
	// whether or not the address has orders, so timing can't reveal it.
	// Whatever can't be sent now stays queued for the hourly retry.
	const { email } = parsed.data
	after(async () => {
		try {
			const queued = await requestTicketResend(email)
			for (const orderId of queued) await sendTicketResend(orderId)
		} catch (error) {
			// Never the address — order ids only, in sendTicketResend's own logs
			console.error('Ticket resend request failed', error)
		}
	})

	return { status: 'requested', message: RESEND_REQUESTED_MESSAGE }
}
