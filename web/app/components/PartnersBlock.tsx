import { PartnersBlock as PartnersBlockType } from '@/types/sanity'
import { getAllPartners } from '@/sanity/fetch'
import PartnerCard from './PartnerCard'

function PartnersShell({ heading, children }: { heading: string; children: React.ReactNode }) {
	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{heading}
				</h2>
				{children}
			</div>
		</section>
	)
}

export default async function PartnersBlock({ block }: { block: PartnersBlockType }) {
	const heading = block.heading ?? 'OUR PARTNERS'

	let partners
	try {
		partners = await getAllPartners()
	} catch (error) {
		console.error('Failed to fetch partners:', error)
		return (
			<PartnersShell heading={heading}>
				<div className="border border-c58-border p-8 md:p-12 text-center">
					<p className="font-body text-body text-c58-ghost">
						Something went wrong loading partners. Please try refreshing the page.
					</p>
				</div>
			</PartnersShell>
		)
	}

	if (!partners.length) {
		return (
			<PartnersShell heading={heading}>
				<div className="border border-c58-border p-8 md:p-12 text-center">
					<p className="font-body text-body text-c58-ghost">No partners added yet.</p>
				</div>
			</PartnersShell>
		)
	}

	return (
		<PartnersShell heading={heading}>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
				{partners.map((partner) => (
					<PartnerCard key={partner._id} partner={partner} />
				))}
			</div>
		</PartnersShell>
	)
}
