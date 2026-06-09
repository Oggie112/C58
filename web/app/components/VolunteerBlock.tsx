'use client'

import { VolunteerBlock as VolunteerBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { motion } from 'motion/react'

export default function VolunteerBlock({ block }: { block: VolunteerBlockType }) {
	if (!block.volunteers || block.volunteers.length === 0) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-16">
					{block.heading ?? 'VOLUNTEERS'}
				</h2>

				<ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{block.volunteers.map((volunteer, i) => (
						<motion.li
							key={volunteer._id}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.15 }}
							transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
							className="group"
						>
							{/* Photo */}
							<div className="relative w-full aspect-square overflow-hidden bg-c58-void mb-4">
								{volunteer.photo ? (
									<Image
										src={urlFor(volunteer.photo).width(400).height(400).url()}
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
							<h3 className="font-display font-bold text-label uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-2">
								{volunteer.name}
							</h3>

							{/* Bio */}
							{volunteer.bio && (
								<p className="font-body text-sm text-c58-muted leading-[1.7]">
									{volunteer.bio}
								</p>
							)}
						</motion.li>
					))}
				</ul>
			</div>
		</section>
	)
}
