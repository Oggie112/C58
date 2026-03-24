import { RichTextBlock as RichTextBlockType } from '@/types/sanity'
import { PortableText } from 'next-sanity'
import portableTextComponents from '@/lib/portableTextComponents'

export default function RichTextBlock({ block }: { block: RichTextBlockType }) {
	if (!block.body) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[560px] mx-auto">
				<PortableText value={block.body} components={portableTextComponents} />
			</div>
		</section>
	)
}
