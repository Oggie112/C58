'use client'

import { SanityEvent } from '@/types/sanity'
import { useState } from 'react'
import { motion } from 'motion/react'
import EventCard from './EventCard'

interface EventListClientProps {
	upcoming: SanityEvent[]
	past: SanityEvent[]
	defaultTab: 'upcoming' | 'past'
}

const CARD_VARIANTS = {
	hidden: { opacity: 0, y: 40 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
	}),
}

export default function EventListClient({ upcoming, past, defaultTab }: EventListClientProps) {
	const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>(defaultTab)

	const events = activeTab === 'upcoming' ? upcoming : past
	const isPast = activeTab === 'past'
	const [featured, ...rest] = events

	return (
		<section className="py-32 px-6">
			<div className="max-w-[1200px] mx-auto">

				{/* Section header */}
				<div className="mb-16">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
						EVENTS
					</h2>

					{/* Tab switcher */}
					<div className="flex items-center gap-8">
						{(['upcoming', 'past'] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`font-body text-label uppercase tracking-[0.15em] pb-2 transition-colors duration-200 ${
									activeTab === tab
										? 'text-c58-white border-b border-c58-ice'
										: 'text-c58-muted hover:text-c58-white'
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</div>

				{/* Empty state */}
				{events.length === 0 && (
					<p className="font-body text-body text-c58-muted">
						{isPast ? 'No past events.' : 'No upcoming events.'}
					</p>
				)}

				{/* Featured card — full width */}
				{featured && (
					<motion.div
						key={`${activeTab}-featured`}
						variants={CARD_VARIANTS}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.15 }}
						custom={0}
						className="mb-6"
					>
						<EventCard event={featured} featured past={isPast} />
					</motion.div>
				)}

				{/* Remaining — 2 column grid */}
				{rest.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{rest.map((event, i) => (
							<motion.div
								key={event._id}
								variants={CARD_VARIANTS}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, amount: 0.15 }}
								custom={i + 1}
							>
								<EventCard event={event} past={isPast} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</section>
	)
}
