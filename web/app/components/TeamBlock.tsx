'use client'

import { TeamBlock as TeamBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import { motion } from 'motion/react'

export default function TeamBlock({ block }: { block: TeamBlockType }) {
	if (!block.members || block.members.length === 0) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">

				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-16">
					THE PEOPLE
				</h2>

				<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{block.members.map((member, i) => (
						<motion.li
							key={member._id}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.15 }}
							transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
							className="group"
						>
							{/* Photo */}
							<div className="relative w-full aspect-square overflow-hidden bg-c58-void mb-6">
								{member.photo ? (
									<Image
										src={urlFor(member.photo).width(600).height(600).url()}
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
							<h3 className="font-display font-bold text-headline uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-2">
								{member.name}
							</h3>

							{/* Role */}
							{member.role && (
								<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">
									{member.role}
								</p>
							)}

							{/* Bio */}
							{member.bio && (
								<p className="font-body text-body text-c58-muted leading-[1.7]">
									{member.bio}
								</p>
							)}
						</motion.li>
					))}
				</ul>
			</div>
		</section>
	)
}
