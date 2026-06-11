import { SanityPartner } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import Image from 'next/image'
import Link from 'next/link'

interface PartnerCardProps {
	partner: SanityPartner
}

function CardContent({ partner }: PartnerCardProps) {
	const logoUrl = partner.logo
		? urlFor(partner.logo).width(400).height(400).url()
		: null

	return (
		<>
			<div className="relative w-full aspect-square overflow-hidden bg-c58-void border-b border-c58-border">
				{logoUrl ? (
					<div className="absolute inset-6">
						<Image
							src={logoUrl}
							alt={`${partner.name} logo`}
							fill
							className="object-contain grayscale group-hover:grayscale-0 transition-[filter] duration-500"
						/>
					</div>
				) : (
					<div className="w-full h-full flex items-center justify-center p-6">
						<span className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-ghost text-center">
							{partner.name}
						</span>
					</div>
				)}
			</div>

			<div className="p-4 md:p-5">
				<h3 className="font-display font-bold text-headline uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-3">
					{partner.name}
				</h3>
				{partner.description && (
					<p className="font-body text-body text-c58-muted leading-[1.7]">
						{partner.description}
					</p>
				)}
			</div>
		</>
	)
}

export default function PartnerCard({ partner }: PartnerCardProps) {
	const className = "group block bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]"

	if (partner.website) {
		return (
			<Link href={partner.website} target="_blank" rel="noopener noreferrer" className={className}>
				<CardContent partner={partner} />
			</Link>
		)
	}

	return (
		<div className={className}>
			<CardContent partner={partner} />
		</div>
	)
}
