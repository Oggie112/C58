import { PartnersBlock as PartnersBlockType } from '@/types/sanity'
import { getAllPartners } from '@/sanity/fetch'
import PageTitle from './PageTitle'
import PartnerRow from './PartnerRow'

function PartnersShell({ heading, subheading, children }: { heading: string; subheading?: string; children: React.ReactNode }) {
	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<PageTitle title={heading} subtitle={subheading} />
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
			<PartnersShell heading={heading} subheading={block.subheading}>
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
			<PartnersShell heading={heading} subheading={block.subheading}>
				<div className="border border-c58-border p-8 md:p-12 text-center">
					<p className="font-body text-body text-c58-ghost">No partners added yet.</p>
				</div>
			</PartnersShell>
		)
	}

	return (
		<PartnersShell heading={heading} subheading={block.subheading}>
			<div>
				{partners.map((partner) => (
					<PartnerRow key={partner._id} partner={partner} />
				))}
			</div>
		</PartnersShell>
	)
}
