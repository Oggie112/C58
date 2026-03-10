import { getSiteSettings } from '../../sanity/fetch'
import NavClient from './NavClient'

export default async function Nav() {
	const settings = await getSiteSettings()
	const navLinks = settings?.navLinks ?? []

	return <NavClient navLinks={navLinks} />
}
