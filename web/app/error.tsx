'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'

// Shown when a page throws while rendering and there's no cached copy to
// serve instead (a failed background re-render keeps the last good page).
// Doesn't cover errors in the root layout itself — that's global-error.tsx.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">Error</p>
				<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					Something went wrong
				</h1>
				<p className="font-body text-body text-c58-muted leading-[1.7] mb-12">
					This page couldn&apos;t be loaded. It&apos;s usually temporary — try again in a moment.
				</p>
				<div className="flex flex-wrap gap-8">
					<button
						type="button"
						onClick={() => retry()}
						className="font-body text-label uppercase tracking-[0.15em] text-c58-ice hover:text-c58-white transition-colors duration-200"
					>
						Try again
					</button>
					<Link
						href="/"
						className="font-body text-label uppercase tracking-[0.15em] text-c58-muted hover:text-c58-white transition-colors duration-200"
					>
						← Back to home
					</Link>
				</div>
			</div>
		</article>
	)
}
