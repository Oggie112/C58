import { SanityPartner } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import Link from 'next/link'

interface PartnerRowProps {
	partner: SanityPartner
}

function RowContent({ partner }: PartnerRowProps) {
	const logoUrl = partner.logo
		? urlFor(partner.logo).width(560).url()
		: null

	return (
		<>
			<div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] shrink-0 overflow-hidden bg-c58-void">
				{logoUrl ? (
					<Image
						src={logoUrl}
						alt={`${partner.name} logo`}
						fill
						className="object-contain p-6 grayscale group-hover:grayscale-0 transition-[filter] duration-500"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center p-6">
						<span className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-ghost text-center">
							{partner.name}
						</span>
					</div>
				)}
			</div>

			<div className="max-w-[680px]">
				<h3 className="font-display font-bold text-row-name uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-3">
					{partner.name}
				</h3>
				{partner.description && (
					<p className="font-body text-body text-c58-muted leading-[1.7] mb-4">
						{partner.description}
					</p>
				)}
				{partner.website && (
					<span className="font-body text-label uppercase tracking-[0.15em] text-c58-ice group-hover:text-c58-ice-light transition-colors duration-200">
						VISIT →
					</span>
				)}
			</div>
		</>
	)
}

export default function PartnerRow({ partner }: PartnerRowProps) {
	const className = "group flex flex-wrap gap-12 border-t border-c58-border py-12 md:py-14 items-start"

	if (partner.website) {
		return (
			<Link href={partner.website} target="_blank" rel="noopener noreferrer" className={className}>
				<RowContent partner={partner} />
			</Link>
		)
	}

	return (
		<div className={className}>
			<RowContent partner={partner} />
		</div>
	)
}
