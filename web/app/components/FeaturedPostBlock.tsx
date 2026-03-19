import { FeaturedPostBlock as FeaturedPostBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import Image from 'next/image'

interface Props {
	block: FeaturedPostBlockType
}

export default function FeaturedPostBlock({ block }: Props) {
	const { post, heading } = block

	if (!post) return null

	const imageUrl = post.image
		? urlFor(post.image).width(1200).height(675).url()
		: null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{heading ?? 'FEATURED POST'}
				</h2>
				<div className="group relative bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]">
					<div className="relative w-full aspect-video overflow-hidden">
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={`Image for ${post.title}`}
								fill
								className="object-cover grayscale-[30%] brightness-[85%] transition-[filter] duration-300 group-hover:grayscale-0 group-hover:brightness-100"
							/>
						) : (
							<div className="w-full h-full bg-c58-void flex items-center justify-center">
								<span className="font-display font-bold uppercase tracking-[0.04em] text-c58-ghost text-[clamp(1.5rem,4vw,3rem)]">
									{post.title}
								</span>
							</div>
						)}
					</div>
					<div className="p-4 md:p-6">
						<span className="font-body text-label text-c58-ice uppercase tracking-[0.15em] block mb-4">
							{formatEventDate(post.date)}
						</span>
						<h3 className="font-display font-bold uppercase leading-[0.9] tracking-[0.04em] text-c58-white text-[clamp(2.25rem,5vw,4rem)]">
							{post.title}
						</h3>
					</div>
				</div>
			</div>
		</section>
	)
}
