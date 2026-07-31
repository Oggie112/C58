'use client'

import { VolunteerBlock as VolunteerBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { motion } from 'motion/react'
import { PortableText } from 'next-sanity'
import portableTextComponents from '@/lib/portableTextComponents'
import SectionMarker from './SectionMarker'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function VolunteerBlock({ block, sectionNumber }: { block: VolunteerBlockType; sectionNumber?: string }) {
	if (!block.volunteers || block.volunteers.length === 0) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				<SectionMarker number={sectionNumber} />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{block.heading ?? 'VOLUNTEERS'}
				</h2>

				{block.intro && (
					<div className="max-w-[680px] mb-16">
						<PortableText value={block.intro} components={portableTextComponents} />
					</div>
				)}

				<ul
					className="grid gap-6"
					style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
				>
					{block.volunteers.map((volunteer, i) => (
						<motion.li
							key={volunteer._id}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.15 }}
							transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT_EXPO }}
							className="group"
						>
							{/* Photo */}
							<div className="relative w-full aspect-square overflow-hidden bg-c58-void mb-4">
								{volunteer.photo ? (
									<Image
										src={urlFor(volunteer.photo).width(400).url()}
										alt={`Photo of ${volunteer.name}`}
										fill
										className="object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<span className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-ghost">
											{volunteer.name.charAt(0)}
										</span>
									</div>
								)}
							</div>

							{/* Name */}
							<h3 className="font-display font-bold text-volunteer-name uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
								{volunteer.name}
							</h3>
						</motion.li>
					))}
				</ul>
			</div>
		</section>
	)
}
