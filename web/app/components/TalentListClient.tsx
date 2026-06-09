'use client'

import { useState, useMemo } from 'react'
import { SanityTalent } from '@/types/sanity'
import { motion, AnimatePresence } from 'motion/react'
import TalentCard from './TalentCard'

interface TalentListClientProps {
	talents: SanityTalent[]
	heading: string
}

export default function TalentListClient({ talents, heading }: TalentListClientProps) {
	const [activeRole, setActiveRole] = useState<string | null>(null)

	const roles = useMemo(
		() => [...new Set(talents.map((t) => t.role).filter((r): r is string => Boolean(r)))],
		[talents]
	)

	const filtered = activeRole ? talents.filter((t) => t.role === activeRole) : talents

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{heading}
				</h2>

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

				<motion.ul
					layout
					className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
				>
					<AnimatePresence mode="popLayout">
						{filtered.map((talent, i) => (
							<motion.li
								key={talent._id}
								layout
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
							>
								<TalentCard talent={talent} />
							</motion.li>
						))}
					</AnimatePresence>
				</motion.ul>
			</div>
		</section>
	)
}
