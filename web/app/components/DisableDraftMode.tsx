'use client'

import { useTransition } from 'react'
import { useIsPresentationTool } from 'next-sanity/hooks'
import { disableDraftMode } from '@/app/actions'

export function DisableDraftMode() {
	const [pending, startTransition] = useTransition()
	const isPresentationTool = useIsPresentationTool()

	// null = still determining, true = inside Studio iframe
	// Only render when definitely outside Presentation Tool
	if (isPresentationTool !== false) return null

	return (
		<button
			type="button"
			onClick={() => startTransition(() => disableDraftMode())}
			className="fixed bottom-4 right-4 z-50 rounded bg-black px-4 py-2 text-sm text-white"
		>
			{pending ? 'Exiting preview...' : 'Exit preview'}
		</button>
	)
}
