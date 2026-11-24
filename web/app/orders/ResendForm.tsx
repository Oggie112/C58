'use client'

import { startTransition, useActionState, useState, type SubmitEvent } from 'react'
import TurnstileChallenge from '@/app/components/TurnstileChallenge'
import { resendTickets, type ResendTicketsState } from './actions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialState: ResendTicketsState = { status: 'idle' }

export default function ResendForm() {
	const [email, setEmail] = useState('')
	const [state, dispatch, isPending] = useActionState(resendTickets, initialState)
	// "Use a different address" brings the form back; the action's state
	// can't be reset, so this hides the confirmation until the next submit
	const [startingAgain, setStartingAgain] = useState(false)
	const canSubmit = EMAIL_PATTERN.test(email) && !isPending

	function submit(turnstileToken?: string) {
		setStartingAgain(false)
		startTransition(() => dispatch({ email, turnstileToken }))
	}

	function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		if (canSubmit) submit()
	}

	function startAgain() {
		setEmail('')
		setStartingAgain(true)
	}

	// "Request received", never "sent": whether anything was sent would say
	// whether the address has orders. Showing the address back makes a typo
	// obvious — it's only what the visitor typed.
	if (state.status === 'requested' && !startingAgain) {
		return (
			<div className="border border-c58-border p-6 md:p-8" role="status">
				<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">Request received</p>
				<p className="font-body text-body text-c58-white mb-4">
					For <span className="text-c58-ice break-all">{email}</span>
				</p>
				<p className="font-body text-body text-c58-muted leading-[1.7] mb-6">{state.message}</p>
				<button
					type="button"
					onClick={startAgain}
					className="font-body text-label uppercase tracking-[0.15em] text-c58-ice hover:text-c58-white transition-colors duration-200"
				>
					Use a different address →
				</button>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-8">
				<label
					htmlFor="resend-email"
					className="block font-body text-label text-c58-muted uppercase tracking-[0.15em] mb-2"
				>
					Email used to buy
				</label>
				<input
					id="resend-email"
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					// Back from the confirmation: straight into the empty field
					autoFocus={startingAgain}
					placeholder="you@example.com"
					className="w-full bg-transparent border border-c58-border text-c58-white px-4 py-3 font-body text-body focus:border-c58-ice-border focus:outline-none transition-colors duration-200"
				/>
			</div>

			{/* An invalid address — the confirmation has its own panel */}
			{state.status === 'invalid' && state.message && (
				<p className="font-body text-body text-c58-muted mb-4" role="status">
					{state.message}
				</p>
			)}

			{/* Re-submits automatically once solved */}
			<TurnstileChallenge active={state.status === 'challenge_required'} onSolved={(token) => submit(token)} />

			<button
				type="submit"
				disabled={!canSubmit}
				className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white active:scale-[0.97] active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] transition-[background-color,transform] duration-200"
			>
				{isPending ? 'Sending…' : 'Resend my tickets →'}
			</button>
		</form>
	)
}
