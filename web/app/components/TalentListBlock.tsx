import { TalentListBlock as TalentListBlockType } from '@/types/sanity'
import { getAllTalents } from '@/sanity/fetch'
import TalentListClient from './TalentListClient'

export default async function TalentListBlock({ block }: { block: TalentListBlockType }) {
	const heading = block.heading ?? 'OUR TALENT'

	let talents
	try {
		talents = await getAllTalents()
	} catch (error) {
		console.error('Failed to fetch talents:', error)
		return (
			<section className="py-16 md:py-32 px-4 md:px-6">
				<div className="max-w-[1200px] mx-auto">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
						{heading}
					</h2>
					<div className="border border-c58-border p-8 md:p-12 text-center">
						<p className="font-body text-body text-c58-ghost">
							Something went wrong loading talent. Please try refreshing the page.
						</p>
					</div>
				</div>
			</section>
		)
	}

	if (!talents.length) {
		return (
			<section className="py-16 md:py-32 px-4 md:px-6">
				<div className="max-w-[1200px] mx-auto">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
						{heading}
					</h2>
					<div className="border border-c58-border p-8 md:p-12 text-center">
						<p className="font-body text-body text-c58-ghost">No talent added yet.</p>
					</div>
				</div>
			</section>
		)
	}

	return <TalentListClient talents={talents} heading={heading} />
}
