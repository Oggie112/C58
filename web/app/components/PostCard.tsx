import { SanityPost } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import Image from 'next/image'
import Link from 'next/link'

interface PostCardProps {
	post: SanityPost
	featured?: boolean
}

export default function PostCard({ post, featured = false }: PostCardProps) {
	const imageUrl = post.image
		? urlFor(post.image).width(featured ? 1200 : 800).height(featured ? 675 : 450).url()
		: null

	return (
		<Link href={`/posts/${post.slug.current}`} className="group relative bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] block">
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
				<h3
					className={`font-display font-bold uppercase leading-[0.9] tracking-[0.04em] text-c58-white ${
						featured ? 'text-[clamp(2.25rem,5vw,4rem)]' : 'text-[clamp(1.5rem,3vw,2.5rem)]'
					}`}
				>
					{post.title}
				</h3>
			</div>
		</Link>
	)
}
