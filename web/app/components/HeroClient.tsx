'use client'

import { HeroBlock as HeroBlockType, SanityEvent, SanityPost } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import EventCard from './EventCard'
import PostCard from './PostCard'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface HeroClientProps {
	block: HeroBlockType
	update: SanityEvent | SanityPost | null
}

export default function HeroClient({ block, update }: HeroClientProps) {
	const [modalOpen, setModalOpen] = useState(false)
	// Video mounts only after the first paint commits, so FCP/LCP resolve on
	// the poster image rather than waiting on the video fetch (see HeroClient
	// background media block below).
	const [videoReady, setVideoReady] = useState(false)
	const [videoLoaded, setVideoLoaded] = useState(false)
	const shouldReduceMotion = useReducedMotion()
	const mediaType = block.bgMedia?.mediaType
	const videoUrl = block.bgMedia?.video?.asset?.url
	const posterUrl = block.bgMedia?.poster ? urlFor(block.bgMedia.poster).width(1600).url() : undefined

	useEffect(() => {
		if (mediaType !== 'video' || !videoUrl) return
		const frame = requestAnimationFrame(() => setVideoReady(true))
		return () => cancelAnimationFrame(frame)
	}, [mediaType, videoUrl])

	const buttonLabel = update?._type === 'post' ? 'SEE UPDATE →' : 'NEXT EVENT →'

	return (
		<>
			<section className="relative min-h-screen flex items-center justify-center bg-c58-black overflow-hidden">

				{/* Background media */}
				{mediaType === 'image' && block.bgMedia?.image && (
					<Image
						src={urlFor(block.bgMedia.image).url()}
						alt="Hero background"
						fill
						priority
						className="object-cover opacity-35 grayscale-[20%]"
					/>
				)}
				{mediaType === 'video' && videoUrl && (
					<>
						{posterUrl && (
							<Image
								src={posterUrl}
								alt="Hero background"
								fill
								priority
								className={`object-cover grayscale-[20%] transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-35'}`}
							/>
						)}
						{videoReady && (
							<video
								autoPlay loop muted playsInline
								preload="none"
								poster={posterUrl}

								onPlaying={() => setVideoLoaded(true)}
								className={`absolute inset-0 w-full h-full object-cover grayscale-[20%] transition-opacity duration-500 ${videoLoaded ? 'opacity-35' : 'opacity-0'}`}
							>
								<source src={videoUrl} type="video/mp4" />
							</video>
						)}
					</>
				)}

				{/* Content */}
				<div className="relative z-10 text-center px-6">
					{block.overlayText && (
						<p className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-12">
							{block.overlayText}
						</p>
					)}
					{update && (
						<button
							onClick={() => setModalOpen(true)}
							className="font-body text-label uppercase tracking-[0.15em] border border-c58-ice-border text-c58-ice px-8 py-3.5 hover:bg-c58-ice-glow hover:border-c58-ice active:scale-[0.97] active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] transition-[background-color,border-color,transform] duration-200"
						>
							{buttonLabel}
						</button>
					)}
				</div>

				{/* Scroll indicator */}
				<div className="absolute bottom-8 right-6 flex flex-col items-center gap-2">
					<span className="font-body text-micro text-c58-muted uppercase tracking-[0.15em]">
						SCROLL
					</span>
					<div className="w-px h-12 bg-c58-muted" />
				</div>
			</section>

			{/* Update modal */}
			<AnimatePresence>
				{modalOpen && update && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[60] bg-c58-black/80 backdrop-blur-sm flex items-center justify-center p-6"
						onClick={() => setModalOpen(false)}
					>
						<motion.div
							initial={{ opacity: 0, transform: shouldReduceMotion ? 'translateY(0px)' : 'translateY(20px)' }}
							animate={{ opacity: 1, transform: 'translateY(0px)' }}
							exit={{ opacity: 0, transform: shouldReduceMotion ? 'translateY(0px)' : 'translateY(20px)' }}
							transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
							className="w-full max-w-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => setModalOpen(false)}
								className="font-body text-label text-c58-muted uppercase tracking-[0.15em] hover:text-c58-white transition-colors duration-200 mb-4 block"
							>
								CLOSE ×
							</button>
							{update._type === 'post'
								? <PostCard post={update as SanityPost} featured />
								: <EventCard event={update as SanityEvent} featured />
							}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
