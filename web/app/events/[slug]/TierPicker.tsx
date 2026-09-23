'use client'

import { useActionState, useMemo, useState, type SubmitEvent } from 'react'
import type { SanityTier } from '@/types/sanity'
import { createOrder, type CreateOrderState } from './actions'

// Placeholder per-order cap — not real availability. 7API.1 (live remaining
// stock) will slot in as a tighter cap here without changing this component.
const PER_ORDER_MAX = 10

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialState: CreateOrderState = { status: 'idle' }

interface TierPickerProps {
	eventDetailsId: string
	tiers: SanityTier[]
}

export default function TierPicker({ eventDetailsId, tiers }: TierPickerProps) {
	const [quantities, setQuantities] = useState<Record<string, number>>({})
	const [email, setEmail] = useState('')
	const [marketingOptIn, setMarketingOptIn] = useState(false)
	const [state, dispatch, isPending] = useActionState(createOrder, initialState)

	const total = useMemo(
		() => tiers.reduce((sum, tier) => sum + (quantities[tier._key] ?? 0) * tier.price, 0),
		[tiers, quantities],
	)
	const totalQuantity = useMemo(
		() => Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
		[quantities],
	)
	const emailIsValid = EMAIL_PATTERN.test(email)
	const canSubmit = totalQuantity > 0 && emailIsValid && !isPending

	function setQuantity(tier: SanityTier, next: number) {
		const cap = Math.min(tier.capacity, PER_ORDER_MAX)
		const clamped = Math.max(0, Math.min(next, cap))
		setQuantities((prev) => ({ ...prev, [tier._key]: clamped }))
	}

	function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!canSubmit) return

		dispatch({
			eventDetailsId,
			items: tiers
				.filter((tier) => (quantities[tier._key] ?? 0) > 0)
				.map((tier) => ({ tierKey: tier._key, quantity: quantities[tier._key] })),
			email,
			marketingOptIn,
		})
	}

	return (
		<form onSubmit={handleSubmit}>
			<ul className="space-y-4 mb-8">
				{tiers.map((tier) => {
					const cap = Math.min(tier.capacity, PER_ORDER_MAX)
					const quantity = quantities[tier._key] ?? 0

					return (
						<li
							key={tier._key}
							className="flex items-start justify-between gap-6 border border-c58-border p-4 md:p-6"
						>
							<div>
								<p className="font-display font-bold uppercase tracking-[0.04em] text-c58-white mb-1">
									{tier.name}
								</p>
								{tier.description && (
									<p className="font-body text-body text-c58-muted mb-2">{tier.description}</p>
								)}
								<p className="font-display font-bold text-c58-ice">£{tier.price.toFixed(2)}</p>
							</div>
							<div className="flex items-center gap-3 shrink-0">
								<button
									type="button"
									onClick={() => setQuantity(tier, quantity - 1)}
									disabled={quantity <= 0}
									aria-label={`Decrease quantity for ${tier.name}`}
									className="w-8 h-8 border border-c58-border text-c58-white disabled:opacity-30 hover:border-c58-ice-border transition-colors duration-200"
								>
									−
								</button>
								<span className="font-body text-body text-c58-white w-6 text-center" aria-live="polite">
									{quantity}
								</span>
								<button
									type="button"
									onClick={() => setQuantity(tier, quantity + 1)}
									disabled={quantity >= cap}
									aria-label={`Increase quantity for ${tier.name}`}
									className="w-8 h-8 border border-c58-border text-c58-white disabled:opacity-30 hover:border-c58-ice-border transition-colors duration-200"
								>
									+
								</button>
							</div>
						</li>
					)
				})}
			</ul>

			<div className="flex items-center justify-between mb-6">
				<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">Total</span>
				<span data-testid="order-total" className="font-display font-bold text-c58-ice">
					£{total.toFixed(2)}
				</span>
			</div>

			<div className="mb-4">
				<label
					htmlFor="email"
					className="block font-body text-label text-c58-muted uppercase tracking-[0.15em] mb-2"
				>
					Email
				</label>
				<input
					id="email"
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					className="w-full bg-transparent border border-c58-border text-c58-white px-4 py-3 font-body text-body focus:border-c58-ice-border focus:outline-none transition-colors duration-200"
				/>
			</div>

			<label className="flex items-start gap-3 mb-8 cursor-pointer">
				<input
					type="checkbox"
					checked={marketingOptIn}
					onChange={(e) => setMarketingOptIn(e.target.checked)}
					className="mt-1"
				/>
				<span className="font-body text-body text-c58-muted">
					Keep me posted about future C58 events and news.
				</span>
			</label>

			{state.status !== 'idle' && state.message && (
				<p className="font-body text-body text-c58-muted mb-4" role="status">
					{state.message}
				</p>
			)}

			<button
				type="submit"
				disabled={!canSubmit}
				className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white active:scale-[0.97] active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] transition-[background-color,transform] duration-200"
			>
				{isPending ? 'Submitting…' : 'Get Tickets →'}
			</button>
		</form>
	)
}
