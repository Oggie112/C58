import { ImageBlock as ImageBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'

export default function ImageBlock({ block }: { block: ImageBlockType }) {
	const imageUrl = urlFor(block.image).width(1200).url()

	return (
		<figure className="py-8 md:py-16 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="relative w-full aspect-video">
					<Image
						src={imageUrl}
						alt={block.caption ?? 'C58 image'}
						fill
						className="object-cover"
					/>
				</div>
				{block.caption && (
					<figcaption className="font-body text-micro text-c58-muted uppercase tracking-[0.15em] mt-4">
						{block.caption}
					</figcaption>
				)}
			</div>
		</figure>
	)
}
