import { ImageBlock as ImageBlockType } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'

const MIN_ASPECT_RATIO = 9 / 16
const MAX_ASPECT_RATIO = 21 / 9

export default function ImageBlock({ block }: { block: ImageBlockType }) {
	const imageUrl = urlFor(block.image).width(1200).url()
	const sourceRatio = block.image.asset.metadata?.dimensions?.aspectRatio ?? 16 / 9
	const aspectRatio = Math.min(Math.max(sourceRatio, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO)

	return (
		<figure className="py-8 md:py-16 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="relative w-full" style={{ aspectRatio }}>
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
