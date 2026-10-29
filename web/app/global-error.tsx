'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import './globals.css'
import { fontVariables } from './fonts'

// Last resort: the root layout itself failed (e.g. Nav/Footer couldn't load
// site settings), so this replaces the whole document — no nav, no footer,
// and it must bring its own <html>, <body>, styles and fonts.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<html lang="en">
			<body className={fontVariables}>
				<title>Something went wrong | C58</title>
				<main className="min-h-screen flex items-center px-4 md:px-6">
					<div className="max-w-[760px] mx-auto w-full">
						<div className="w-15 h-px bg-c58-ice mb-6" />
						<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">C58</p>
						<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
							Something went wrong
						</h1>
						<p className="font-body text-body text-c58-muted leading-[1.7] mb-12">
							The site couldn&apos;t be loaded. It&apos;s usually temporary — try again in a moment.
						</p>
						<div className="flex flex-wrap gap-8">
							<button
								type="button"
								onClick={() => retry()}
								className="font-body text-label uppercase tracking-[0.15em] text-c58-ice hover:text-c58-white transition-colors duration-200"
							>
								Try again
							</button>
							{/* A full page load is the better recovery when the root layout is broken */}
							{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
							<a
								href="/"
								className="font-body text-label uppercase tracking-[0.15em] text-c58-muted hover:text-c58-white transition-colors duration-200"
							>
								← Back to home
							</a>
						</div>
					</div>
				</main>
			</body>
		</html>
	)
}
