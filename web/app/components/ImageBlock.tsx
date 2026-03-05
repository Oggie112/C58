import { ImageBlock as ImageBlockType } from "@/types/sanity"
import { urlFor } from "@/sanity/image"
import Image from "next/image"

export default function ImageBlock({ block }: { block: ImageBlockType }) {
	const imageUrl = urlFor(block.image).url()

	return (
		<figure>
			<Image src={imageUrl} alt={block.caption ?? ""} fill />
			{block.caption && <figcaption>{block.caption}</figcaption>}
		</figure>
	)
}
