import { RichTextBlock as RichTextBlockType } from "@/types/sanity"
import { PortableText } from "next-sanity"

export default function RichTextBlock({ block }: { block: RichTextBlockType }) {
	if (!block.body) return null

	return (
		<div>
			<PortableText value={block.body} />
		</div>
	)
}
