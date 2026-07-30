import { SanityTalent } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import Link from 'next/link'

interface TalentRowProps {
	talent: SanityTalent
}

export default function TalentRow({ talent }: TalentRowProps) {
	const imageUrl = talent.photo
		? urlFor(talent.photo).width(440).url()
		: null

	return (
		<Link
			href={`/talents/${talent.slug.current}`}
			className="group flex flex-wrap gap-12 border-t border-c58-border py-12 md:py-14 items-start"
		>
			<div className="relative w-[220px] h-[220px] shrink-0 overflow-hidden bg-c58-void">
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

			<div className="max-w-[680px]">
				{talent.role && (
					<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-2">
						{talent.role}
					</p>
				)}
				<h3 className="font-display font-bold text-row-name uppercase leading-[0.9] tracking-[0.04em] text-c58-white group-hover:text-c58-ice transition-colors duration-200 mb-3">
					{talent.name}
				</h3>
				{talent.bio && (
					<p className="font-body text-body text-c58-muted leading-[1.7]">
						{talent.bio}
					</p>
				)}
			</div>
		</Link>
	)
}
