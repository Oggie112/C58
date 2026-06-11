'use client'

import { useEffect, useRef, useState } from 'react'
import { InstagramBlock as InstagramBlockType } from '@/types/sanity'
import BeholdWidget from '@behold/react'

export default function InstagramBlock({ block }: { block: InstagramBlockType }) {
	const feedId = process.env.NEXT_PUBLIC_BEHOLD_FEED_ID
	const widgetRef = useRef<HTMLDivElement>(null)
	const [showFallback, setShowFallback] = useState(false)
	const loaded = useRef(false)

	const handleLoad = () => {
		loaded.current = true
	}

	useEffect(() => {
		if (!feedId) return
		const timeout = setTimeout(() => {
			if (!loaded.current || widgetRef.current?.offsetHeight === 0) {
				setShowFallback(true)
			}
		}, 3000)
		return () => clearTimeout(timeout)
	}, [feedId])

	const fallback = (
		<div className="flex flex-col items-center gap-6 py-16 text-center">
			<p className="font-body text-body text-c58-muted">
				Find us on Instagram for the latest updates.
			</p>
			{block.instagramUrl && (
				<a
					href={block.instagramUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-block border border-c58-ice text-c58-ice font-body text-label uppercase tracking-[0.15em] px-8 py-3 hover:bg-c58-ice hover:text-c58-void transition-colors duration-300"
				>
					Follow Us
				</a>
			)}
		</div>
	)

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{block.heading ?? 'INSTAGRAM'}
				</h2>

				{!feedId ? fallback : (
					<>
						<div ref={widgetRef} className={showFallback ? 'hidden' : ''}>
							<BeholdWidget feedId={feedId} onLoad={handleLoad} />
						</div>
						{showFallback && fallback}
					</>
				)}
			</div>
		</section>
	)
}
