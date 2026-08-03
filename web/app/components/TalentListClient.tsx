'use client'

import { useState, useMemo } from 'react'
import { SanityTalent } from '@/types/sanity'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import PageTitle from './PageTitle'
import TalentRow from './TalentRow'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface TalentListClientProps {
	talents: SanityTalent[]
	heading: string
	subheading?: string
}

export default function TalentListClient({ talents, heading, subheading }: TalentListClientProps) {
	const [activeRole, setActiveRole] = useState<string | null>(null)
	const shouldReduceMotion = useReducedMotion()

	const roles = useMemo(
		() => [...new Set(talents.map((t) => t.role).filter((r): r is string => Boolean(r)))],
		[talents]
	)

	const filtered = activeRole ? talents.filter((t) => t.role === activeRole) : talents

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<PageTitle title={heading} subtitle={subheading} className="mb-10" />

				{roles.length > 1 && (
					<div className="flex flex-wrap gap-2 mb-12">
						<button
							onClick={() => setActiveRole(null)}
							className={`font-body text-label uppercase tracking-[0.15em] px-5 py-2.5 border transition-colors duration-200 ${
								activeRole === null
									? 'bg-c58-ice text-c58-black border-c58-ice'
									: 'border-c58-border text-c58-muted hover:border-c58-ice-border hover:text-c58-white'
							}`}
						>
							All
						</button>
						{roles.map((role) => (
							<button
								key={role}
								onClick={() => setActiveRole(role)}
								className={`font-body text-label uppercase tracking-[0.15em] px-5 py-2.5 border transition-colors duration-200 ${
									activeRole === role
										? 'bg-c58-ice text-c58-black border-c58-ice'
										: 'border-c58-border text-c58-muted hover:border-c58-ice-border hover:text-c58-white'
								}`}
							>
								{role}
							</button>
						))}
					</div>
				)}

				<motion.ul layout>
					<AnimatePresence mode="popLayout">
						{filtered.map((talent, i) => (
							<motion.li
								key={talent._id}
								layout
								initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
								transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT_EXPO }}
							>
								<TalentRow talent={talent} />
							</motion.li>
						))}
					</AnimatePresence>
				</motion.ul>
			</div>
		</section>
	)
}
