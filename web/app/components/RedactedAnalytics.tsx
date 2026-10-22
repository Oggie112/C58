'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { redactAnalyticsUrl } from '@/lib/redactAnalyticsUrl'

// Client wrapper only because beforeSend is a function prop, which a server
// component (layout.tsx) can't pass across the boundary.
export default function RedactedAnalytics() {
	return (
		<>
			<Analytics beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />
			<SpeedInsights beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />
		</>
	)
}
