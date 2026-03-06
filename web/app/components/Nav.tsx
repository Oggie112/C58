import Link from 'next/link'
import { getSiteSettings } from '../../sanity/fetch'

export default async function Nav() {
	const settings = await getSiteSettings()
	const navLinks = settings?.navLinks ?? []

	return (
		<nav>
			<ul>
				{navLinks.map((link) => (
					<li key={link.href}>
						<Link href={link.href}>{link.label}</Link>
					</li>
				))}
			</ul>
		</nav>
	)
}
