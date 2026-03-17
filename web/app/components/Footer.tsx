import { getSiteSettings } from '@/sanity/fetch'

export default async function Footer() {
	const settings = await getSiteSettings()
	const socialLinks = settings?.socialLinks ?? []
	const privacyPolicyHref = settings?.privacyPolicySlug ? `/${settings.privacyPolicySlug}` : null
	const year = new Date().getFullYear()

	return (
		<footer className="border-t border-c58-border px-4 md:px-6 py-6">
			<div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<span className="font-body text-micro text-c58-muted uppercase tracking-[0.15em]">
					© {year} Courtyard 58
				</span>

				{socialLinks.length > 0 && (
					<nav className="flex gap-6" aria-label="Social links">
						{socialLinks.map((link) => (
							<a
								key={link.platform}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="font-body text-micro text-c58-muted uppercase tracking-[0.15em] hover:text-c58-ice transition-colors duration-200"
							>
								{link.platform} →
							</a>
						))}
					</nav>
				)}

				{privacyPolicyHref && (
					<a
						href={privacyPolicyHref}
						className="font-body text-micro text-c58-muted uppercase tracking-[0.15em] hover:text-c58-ice transition-colors duration-200"
					>
						Privacy Policy
					</a>
				)}
			</div>
		</footer>
	)
}
