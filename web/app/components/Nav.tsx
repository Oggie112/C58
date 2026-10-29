import { getSiteSettings } from '../../sanity/fetch'
import { getDynamicFetchOptions } from '../../sanity/fetchOptions'
import NavClient from './NavClient'

export default async function Nav() {
	const settings = await getSiteSettings(await getDynamicFetchOptions())
	const navLinks = settings?.navLinks ?? []

	return <NavClient navLinks={navLinks} />
}
