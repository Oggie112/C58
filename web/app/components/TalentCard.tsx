import { SanityTalent } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import Link from 'next/link'

interface TalentCardProps {
	talent: SanityTalent
}

export default function TalentCard({ talent }: TalentCardProps) {
	const imageUrl = talent.photo
		? urlFor(talent.photo).width(600).height(800).url()
		: null

	return (
		<Link
			href={`/talents/${talent.slug.current}`}
			className="group block bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]"
		>
			<div className="relative w-full aspect-[3/4] overflow-hidden bg-c58-void">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={`Photo of ${talent.name}`}
						fill
						className="object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<span className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-ghost">
							{talent.name.charAt(0)}
						</span>
					</div>
				)}
			</div>

			<div className="p-4 md:p-5">
				{talent.role && (
					<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-2">
						{talent.role}
					</p>
				)}
				<h3 className="font-display font-bold text-headline uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
					{talent.name}
				</h3>
			</div>
		</Link>
	)
}
