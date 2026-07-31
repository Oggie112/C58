'use client'

import { TeamBlock as TeamBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { PortableText } from 'next-sanity'
import portableTextComponents from '@/lib/portableTextComponents'
import SectionMarker from './SectionMarker'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function TeamBlock({ block, sectionNumber }: { block: TeamBlockType; sectionNumber?: string }) {
	const shouldReduceMotion = useReducedMotion()
	if (!block.members || block.members.length === 0) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				<SectionMarker number={sectionNumber} />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{block.heading ?? 'THE PEOPLE'}
				</h2>

				{block.intro && (
					<div className="max-w-[680px] mb-16">
						<PortableText value={block.intro} components={portableTextComponents} />
					</div>
				)}

				<ul
					className="grid gap-8"
					style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
				>
					{block.members.map((member, i) => (
						<motion.li
							key={member._id}
							initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.15 }}
							transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: EASE_OUT_EXPO }}
							className="group"
						>
							{/* Photo */}
							<div className="relative w-full aspect-square overflow-hidden bg-c58-void mb-6">
								{member.photo ? (
									<Image
										src={urlFor(member.photo).width(600).url()}
										alt={`Photo of ${member.name}`}
										fill
										className="object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<span className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-ghost">
											{member.name.charAt(0)}
										</span>
									</div>
								)}
							</div>

							{/* Name */}
							<h3 className="font-display font-bold text-team-name uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-2">
								{member.name}
							</h3>

							{/* Role */}
							{member.role && (
								<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em]">
									{member.role}
								</p>
							)}
						</motion.li>
					))}
				</ul>
			</div>
		</section>
	)
}
