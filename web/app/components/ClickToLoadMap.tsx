'use client'

import { useState } from 'react'
import { googleMapsSearchUrl, singleLineAddress } from '@/lib/address'

// Google Maps only loads once the visitor asks for it: the embed sends their
// IP to Google and can set cookies, so the click is the consent — no cookie
// banner needed for a single embed (compliance C1). The choice isn't
// remembered, so there's nothing stored to cover in the policy.
export default function ClickToLoadMap({ address }: { address: string }) {
	const [loaded, setLoaded] = useState(false)
	const query = encodeURIComponent(address)

	return (
		<div className="w-full aspect-video border border-c58-border">
			{loaded ? (
				<iframe
					src={`https://maps.google.com/maps?q=${query}&output=embed`}
					title={`Map showing ${singleLineAddress(address)}`}
					width="100%"
					height="100%"
					style={{ border: 0 }}
					allowFullScreen={false}
					referrerPolicy="no-referrer-when-downgrade"
				/>
			) : (
				<div className="w-full h-full flex flex-col items-center justify-center gap-4 px-4 text-center">
					<button
						type="button"
						onClick={() => setLoaded(true)}
						className="font-body text-label uppercase tracking-[0.15em] border border-c58-border text-c58-white px-8 py-3.5 hover:border-c58-ice-border transition-colors duration-200"
					>
						Show map
					</button>
					<p className="font-body text-body text-c58-muted">
						Loads from Google Maps, which may set cookies.
					</p>
					{/* A plain link sends nothing to Google until it's followed */}
					<a
						href={googleMapsSearchUrl(address)}
						target="_blank"
						rel="noopener noreferrer"
						className="font-body text-label uppercase tracking-[0.15em] text-c58-muted hover:text-c58-ice transition-colors duration-200"
					>
						Open in Google Maps →
					</a>
				</div>
			)}
		</div>
	)
}
