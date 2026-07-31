'use client'

import { SanityEvent } from '@/types/sanity'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import EventCard from './EventCard'
import PageTitle from './PageTitle'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface EventListClientProps {
	upcoming: SanityEvent[]
	past: SanityEvent[]
	defaultTab: 'upcoming' | 'past'
	heading: string
	subheading?: string
}

export default function EventListClient({ upcoming, past, defaultTab, heading, subheading }: EventListClientProps) {
	const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>(defaultTab)
	const shouldReduceMotion = useReducedMotion()

	const cardVariants = {
		hidden: { opacity: 0, transform: shouldReduceMotion ? 'translateY(0px)' : 'translateY(40px)' },
		visible: (i: number) => ({
			opacity: 1,
			transform: 'translateY(0px)',
			transition: { duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: EASE_OUT_EXPO },
		}),
	}

	const events = activeTab === 'upcoming' ? upcoming : past
	const isPast = activeTab === 'past'
	const [featured, ...rest] = events

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				{/* Section header */}
				<div className="mb-16">
					<PageTitle title={heading} subtitle={subheading} className="mb-10" />

					{/* Tab switcher */}
					<div className="flex items-center gap-8">
						{(['upcoming', 'past'] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`font-body text-label uppercase tracking-[0.15em] py-3 transition-colors duration-200 ${
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
						variants={cardVariants}
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
								variants={cardVariants}
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
