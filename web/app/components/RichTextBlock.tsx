import { RichTextBlock as RichTextBlockType } from '@/types/sanity'
import { PortableText } from 'next-sanity'
import portableTextComponents from '@/lib/portableTextComponents'
import SectionMarker from './SectionMarker'

const ALIGNMENT_CLASS = {
	left: 'mr-auto',
	center: 'mx-auto',
	right: 'ml-auto',
} as const

export default function RichTextBlock({ block, sectionNumber }: { block: RichTextBlockType; sectionNumber?: string }) {
	if (!block.body) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className={`max-w-[560px] ${ALIGNMENT_CLASS[block.alignment ?? 'left']}`}>
					{sectionNumber && <SectionMarker number={sectionNumber} />}
					<PortableText value={block.body} components={portableTextComponents} />
				</div>
			</div>
		</section>
	)
}
