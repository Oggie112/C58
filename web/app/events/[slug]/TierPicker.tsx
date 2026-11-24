'use client'

import { startTransition, useActionState, useEffect, useMemo, useState, type SubmitEvent } from 'react'
import type { SanityTier, TicketingStatus } from '@/types/sanity'
import { computeRemainingStock, type TierStock } from '@/lib/stock'
import { PER_ORDER_MAX } from '@/lib/orderLimits'
import { MARKETING_OPT_IN_WORDING } from '@/lib/marketingOptIn'
import {
	eventSaleState,
	saleStatusLabel,
	saleUnavailableMessage,
	tierSaleState,
	type EventSaleState,
	type TierSaleState,
} from '@/lib/saleState'
import { formatSaleTime } from '@/lib/dateFormat'
import TurnstileChallenge from '@/app/components/TurnstileChallenge'
import { createOrder, type CreateOrderState } from './actions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialActionState: CreateOrderState = { status: 'idle' }

type StockState =
	| { status: 'loading' }
	| { status: 'ready'; stock: Record<string, TierStock> }
	| { status: 'error' }

interface TierPickerProps {
	eventDetailsId: string
	tiers: SanityTier[]
	// From isMarketingOptInEnabled() on the server — the checkbox is only
	// shown when marketing opt-in is switched on (see lib/marketingOptIn.ts)
	marketingOptInEnabled: boolean
	// The editor's status and the event's date (YYYY-MM-DD), for the live
	// sale state — the page is prerendered and cached, so it can't know
	ticketingStatus: TicketingStatus
	eventDate: string | null
}

// The editor's status as a sale state — what's shown until the live state is
// known (and what the server rendered, so hydration matches)
function staticSaleState(ticketingStatus: TicketingStatus): EventSaleState {
	return ticketingStatus === 'closed' ? { status: 'closed', reason: 'status' } : { status: ticketingStatus }
}

const TIER_NOTE: Partial<Record<TierSaleState, string>> = {
	sold_out: 'Sold out',
	awaiting_previous: 'Opens once the previous tier sells out',
	ended: 'Sale ended',
}

export default function TierPicker({
	eventDetailsId,
	tiers,
	marketingOptInEnabled,
	ticketingStatus,
	eventDate,
}: TierPickerProps) {
	const [quantities, setQuantities] = useState<Record<string, number>>({})
	const [email, setEmail] = useState('')
	const [marketingOptIn, setMarketingOptIn] = useState(false)
	const [stockState, setStockState] = useState<StockState>({ status: 'loading' })
	// Set in the browser once stock settles — never during the server render
	// or the first client render, so they match (no hydration mismatch)
	const [now, setNow] = useState<Date | null>(null)
	const [state, dispatch, isPending] = useActionState(createOrder, initialActionState)

	useEffect(() => {
		let cancelled = false

		fetch(`/api/stock/${eventDetailsId}`)
			.then((res) => {
				if (!res.ok) throw new Error(`Stock fetch failed: ${res.status}`)
				return res.json()
			})
			.then((counts) => {
				if (cancelled) return
				setStockState({ status: 'ready', stock: computeRemainingStock(tiers, counts) })
				setNow(new Date())
			})
			.catch(() => {
				if (cancelled) return
				setStockState({ status: 'error' })
				setNow(new Date())
			})

		return () => {
			cancelled = true
		}
	}, [eventDetailsId, tiers])

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

	function capFor(tier: SanityTier): number {
		const baseCap = Math.min(tier.capacity, PER_ORDER_MAX)
		if (stockState.status !== 'ready') return baseCap
		return Math.min(baseCap, stockState.stock[tier._key]?.remaining ?? 0)
	}

	// The live sale state: the editor's status and the event date, plus stock
	// once loaded. Until the browser has settled (`now`), the editor's status
	// alone — what the server rendered. The server enforces the same rules.
	const sale: EventSaleState = now
		? eventSaleState({
				ticketingStatus,
				eventDate: eventDate ?? undefined,
				tiers,
				stock: stockState.status === 'ready' ? stockState.stock : undefined,
				now,
			})
		: staticSaleState(ticketingStatus)

	// Per-tier state, once stock and the clock are known
	function tierState(tier: SanityTier): TierSaleState | null {
		if (stockState.status !== 'ready' || !now) return null
		return tierSaleState(tier, stockState.stock[tier._key] ?? { remaining: 0, isOpen: false }, now)
	}

	function isTierOpen(tier: SanityTier): boolean {
		if (sale.status !== 'on_sale') return false
		// Permissive by default: only ever closed once we *know* it is, from
		// real data. While loading or on fetch failure, don't claim a tier is
		// shut — the disabled buttons in that state come from `loading`
		// itself, not from this.
		const state = tierState(tier)
		return state === null || state === 'on_sale'
	}

	function tierNote(tier: SanityTier): string | undefined {
		const state = tierState(tier)
		if (state === 'not_started' && tier.saleStart) return `On sale from ${formatSaleTime(tier.saleStart)}`
		return state ? TIER_NOTE[state] : undefined
	}

	function setQuantity(tier: SanityTier, next: number) {
		const clamped = Math.max(0, Math.min(next, capFor(tier)))
		setQuantities((prev) => ({ ...prev, [tier._key]: clamped }))
	}

	function submitOrder(turnstileToken?: string) {
		startTransition(() => {
			dispatch({
				eventDetailsId,
				items: tiers
					.filter((tier) => (quantities[tier._key] ?? 0) > 0)
					.map((tier) => ({ tierKey: tier._key, quantity: quantities[tier._key] })),
				email,
				marketingOptIn,
				turnstileToken,
			})
		})
	}

	function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!canSubmit) return
		submitOrder()
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex items-center justify-between mb-6">
				<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white">
					Tickets
				</h2>
				<span data-testid="sale-status" className="font-body text-label uppercase tracking-[0.15em] text-c58-ice">
					{saleStatusLabel(sale)}
				</span>
			</div>

			{stockState.status === 'loading' && (
				<p className="font-body text-label text-c58-muted uppercase tracking-[0.15em] mb-4">
					Checking availability…
				</p>
			)}

			<ul className="space-y-4 mb-8">
				{tiers.map((tier) => {
					const cap = capFor(tier)
					const quantity = quantities[tier._key] ?? 0
					const loading = stockState.status === 'loading'
					const open = isTierOpen(tier)
					const note = tierNote(tier)

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
								{note && (
									<p className="font-body text-label text-c58-muted uppercase tracking-[0.15em] mt-2">
										{note}
									</p>
								)}
							</div>
							<div className="flex items-center gap-3 shrink-0">
								<button
									type="button"
									onClick={() => setQuantity(tier, quantity - 1)}
									disabled={loading || !open || quantity <= 0}
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
									disabled={loading || !open || quantity >= cap}
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

			{sale.status === 'on_sale' ? (
				<>
					<div className="flex items-center justify-between mb-6">
						<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">Total</span>
						<span data-testid="order-total" className="font-display font-bold text-c58-ice">
							£{total.toFixed(2)}
						</span>
					</div>

					{/* Takes the checkbox's bottom spacing when it's the last field */}
					<div className={marketingOptInEnabled ? 'mb-4' : 'mb-8'}>
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

					{marketingOptInEnabled && (
						<label className="flex items-start gap-3 mb-8 cursor-pointer">
							<input
								type="checkbox"
								checked={marketingOptIn}
								onChange={(e) => setMarketingOptIn(e.target.checked)}
								className="mt-1"
							/>
							<span className="font-body text-body text-c58-muted">
								{MARKETING_OPT_IN_WORDING}
							</span>
						</label>
					)}

					{state.status !== 'idle' && state.message && (
						<p className="font-body text-body text-c58-muted mb-4" role="status">
							{state.message}
						</p>
					)}

					{/* Re-submits automatically once solved, rather than making the
					    buyer click again */}
					<TurnstileChallenge
						active={state.status === 'challenge_required'}
						onSolved={(token) => submitOrder(token)}
					/>

					<button
						type="submit"
						disabled={!canSubmit}
						className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white active:scale-[0.97] active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] transition-[background-color,transform] duration-200"
					>
						{isPending ? 'Submitting…' : 'Get Tickets →'}
					</button>
				</>
			) : (
				<p className="font-body text-body text-c58-muted" role="status">
					{saleUnavailableMessage(sale)}
				</p>
			)}
		</form>
	)
}
