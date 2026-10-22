'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_INTERVAL_MS = 3000
const MAX_REFRESHES = 20 // ~1 minute

// Re-renders the server page on an interval while the order is still
// pending — each render re-runs confirmOrder, so the page flips to paid on
// its own once SumUp settles. Unmounts as soon as the status changes, since
// the server stops rendering it. Gives up after ~a minute rather than
// polling SumUp indefinitely from an open tab.
export default function PendingRefresh() {
	const router = useRouter()
	const [refreshCount, setRefreshCount] = useState(0)
	const gaveUp = refreshCount >= MAX_REFRESHES

	useEffect(() => {
		if (gaveUp) return
		const timer = setTimeout(() => {
			router.refresh()
			setRefreshCount((count) => count + 1)
		}, REFRESH_INTERVAL_MS)
		return () => clearTimeout(timer)
	}, [router, refreshCount, gaveUp])

	return (
		<p className="font-body text-c58-muted">
			{gaveUp
				? "Still processing. If you've paid, your tickets will appear here and in your confirmation email — refresh this page later."
				: 'Checking with our payment provider…'}
		</p>
	)
}
