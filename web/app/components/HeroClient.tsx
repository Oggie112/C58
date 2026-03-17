'use client'

import { HeroBlock as HeroBlockType, SanityEvent } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import EventCard from './EventCard'

interface HeroClientProps {
	block: HeroBlockType
	nextEvent: SanityEvent | null
}

export default function HeroClient({ block, nextEvent }: HeroClientProps) {
	const [modalOpen, setModalOpen] = useState(false)
	const mediaType = block.bgMedia?.mediaType

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
				{mediaType === 'video' && block.bgMedia?.video?.asset?.url && (
					<video
						autoPlay loop muted playsInline
						className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale-[20%]"
					>
						<source src={block.bgMedia.video.asset.url} type="video/mp4" />
					</video>
				)}

				{/* Content */}
				<div className="relative z-10 text-center px-6">
					{block.overlayText && (
						<p className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-12">
							{block.overlayText}
						</p>
					)}
					{nextEvent && (
						<button
							onClick={() => setModalOpen(true)}
							className="font-body text-label uppercase tracking-[0.15em] border border-c58-ice-border text-c58-ice px-8 py-3.5 hover:bg-c58-ice-glow hover:border-c58-ice transition-[background-color,border-color] duration-200"
						>
							NEXT EVENT →
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

			{/* Next event modal */}
			<AnimatePresence>
				{modalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[60] bg-c58-black/80 backdrop-blur-sm flex items-center justify-center p-6"
						onClick={() => setModalOpen(false)}
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="w-full max-w-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => setModalOpen(false)}
								className="font-body text-label text-c58-muted uppercase tracking-[0.15em] hover:text-c58-white transition-colors duration-200 mb-4 block"
							>
								CLOSE ×
							</button>
							<EventCard event={nextEvent!} featured />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
