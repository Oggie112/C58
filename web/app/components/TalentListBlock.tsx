import { TalentListBlock as TalentListBlockType } from '@/types/sanity'
import PageTitle from './PageTitle'
import TalentListClient from './TalentListClient'

export default function TalentListBlock({ block }: { block: TalentListBlockType }) {
	const heading = block.heading ?? 'OUR TALENT'
	const { talents } = block

	if (!talents.length) {
		return (
			<section className="py-16 md:py-32 px-4 md:px-6">
				<div className="max-w-[1200px] mx-auto">
					<PageTitle title={heading} subtitle={block.subheading} />
					<div className="border border-c58-border p-8 md:p-12 text-center">
						<p className="font-body text-body text-c58-ghost">No talent added yet.</p>
					</div>
				</div>
			</section>
		)
	}

	return <TalentListClient talents={talents} heading={heading} subheading={block.subheading} />
}
