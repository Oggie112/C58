import { ContactBlock as ContactBlockType } from '@/types/sanity'
import { getSiteSettings } from '@/sanity/fetch'

export default async function ContactBlock({ block }: { block: ContactBlockType }) {
	let settings
	try {
		settings = await getSiteSettings()
	} catch (error) {
		console.error('Failed to fetch site settings:', error)
		return null
	}

	console.log('[ContactBlock] settings:', JSON.stringify(settings, null, 2))

	if (!settings) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6 border-t border-c58-border">
			<div className="max-w-[1200px] mx-auto">

				<div className="w-15 h-px bg-c58-ice mb-6" />

				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 mb-16">
					<h2 className="font-display font-bold text-subhead md:text-headline uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
						WANT TO WORK WITH US?
					</h2>
					{settings.email && (
						<a
							href={`mailto:${settings.email}`}
							className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 hover:-translate-y-0.5 hover:bg-c58-ice-light transition-[transform,background-color] duration-200 self-start md:self-auto"
						>
							GET IN TOUCH →
						</a>
					)}
				</div>

				{/* Contact details */}
				<div className="flex flex-col md:flex-row gap-8 mb-16">
					{settings.email && (
						<div>
							<span className="block font-body text-micro text-c58-muted uppercase tracking-[0.15em] mb-2">
								EMAIL
							</span>
							<a
								href={`mailto:${settings.email}`}
								className="font-body text-body text-c58-white hover:text-c58-ice transition-colors duration-200"
							>
								{settings.email}
							</a>
						</div>
					)}
					{settings.phone && (
						<div>
							<span className="block font-body text-micro text-c58-muted uppercase tracking-[0.15em] mb-2">
								PHONE
							</span>
							<a
								href={`tel:${settings.phone}`}
								className="font-body text-body text-c58-white hover:text-c58-ice transition-colors duration-200"
							>
								{settings.phone}
							</a>
						</div>
					)}
					{settings.address && (
						<div>
							<span className="block font-body text-micro text-c58-muted uppercase tracking-[0.15em] mb-2">
								LOCATION
							</span>
							<p className="font-body text-body text-c58-white">
								{settings.address}
							</p>
						</div>
					)}
				</div>

				{/* Map */}
				{block.showMap && settings.address && (
					<div className="w-full aspect-video border border-c58-border">
						<iframe
							src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
							width="100%"
							height="100%"
							style={{ border: 0 }}
							allowFullScreen={false}
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						/>
					</div>
				)}
			</div>
		</section>
	)
}
