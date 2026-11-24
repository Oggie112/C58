'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: HTMLElement,
				params: { sitekey: string; callback: (token: string) => void; 'error-callback'?: (errorCode: string) => void },
			) => string
			remove: (widgetId: string) => void
		}
	}
}

interface TurnstileChallengeProps {
	// True once the server has answered `challenge_required`
	active: boolean
	// Called with the token once the visitor passes — re-submit with it
	onSolved: (token: string) => void
}

// Cloudflare Turnstile, shown only when a form's server action asks for a
// challenge (rate limit reached) — shared by the ticket picker and the
// resend form. Nothing loads before then, so most visitors never contact
// Cloudflare (compliance C3).
export default function TurnstileChallenge({ active, onSolved }: TurnstileChallengeProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [scriptLoaded, setScriptLoaded] = useState(false)
	const [failed, setFailed] = useState(false)
	// Inlined at build time — missing means the widget can never render
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

	// Always the caller's latest onSolved — it re-submits the form's current
	// values when the challenge resolves, not whatever they were when the
	// widget mounted — without re-rendering the widget on every keystroke
	const handleSolved = useEffectEvent((token: string) => onSolved(token))

	// Turnstile reports misconfiguration (e.g. this hostname not on the
	// widget's allowlist) through error-callback rather than throwing
	const handleError = useEffectEvent((errorCode: string) => {
		console.error(`Turnstile security check failed to load: ${errorCode}`)
		setFailed(true)
	})

	useEffect(() => {
		if (!active || !scriptLoaded) return
		if (!siteKey) {
			console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set — the security check cannot render')
			return
		}
		if (!window.turnstile || !containerRef.current) return

		const widgetId = window.turnstile.render(containerRef.current, {
			sitekey: siteKey,
			callback: handleSolved,
			'error-callback': handleError,
		})

		return () => window.turnstile?.remove(widgetId)
	}, [active, scriptLoaded, siteKey])

	if (!active) return null

	// Without this, a broken challenge is just an empty space and a visitor
	// who can't get past it — with nothing to say why
	const unavailable = !siteKey || failed

	return (
		<>
			{/* onReady, not onLoad: it also fires when the script is already
			    loaded from an earlier page, where onLoad never would */}
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
				onReady={() => setScriptLoaded(true)}
				onError={() => {
					console.error('Turnstile script failed to load')
					setFailed(true)
				}}
			/>

			{/* Bridges the gap while the script downloads — the widget brings
			    its own "Verifying…" once it renders */}
			{!scriptLoaded && !unavailable && (
				<p className="font-body text-body text-c58-muted mb-4" role="status">
					Running a quick security check…
				</p>
			)}

			<div ref={containerRef} className="mb-4" />

			{unavailable && (
				<p className="font-body text-body text-c58-muted mb-4" role="alert">
					We couldn&apos;t load a quick security check. Please refresh the page and try again in a few minutes.
				</p>
			)}
		</>
	)
}
