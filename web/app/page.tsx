import type { Metadata } from "next"
import { getPageBySlug, getSiteSettings } from "@/sanity/fetch"
import { getDynamicFetchOptions, getMetadataFetchOptions } from "@/sanity/fetchOptions"
import PageBuilder from "@/app/components/PageBuilder"
import JsonLd from "@/app/components/JsonLd"
import { urlFor } from "@/sanity/image"
import { organizationJsonLd } from "@/lib/structuredData"
import { siteUrl } from "@/lib/siteUrl"

const HOME_SLUG = "home"

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPageBySlug(HOME_SLUG, await getMetadataFetchOptions())
	if (!page) return {}

	const seoImage = page.seo?.image
		? urlFor(page.seo.image).width(1200).height(630).url()
		: undefined

	return {
		title: page.seo?.title ?? page.title,
		description: page.seo?.description,
		openGraph: {
			title: page.seo?.title ?? page.title,
			description: page.seo?.description,
			...(seoImage && { images: [{ url: seoImage, width: 1200, height: 630 }] }),
		},
	}
}

export default async function Home() {
	const options = await getDynamicFetchOptions()
	const [page, settings] = await Promise.all([getPageBySlug(HOME_SLUG, options), getSiteSettings(options)])
	if (!page) return <div>Home page not found — create a page in Sanity with the slug &quot;home&quot;.</div>
	return (
		<>
			{/* Tells Google that Courtyard 58, C58, this site and its social
			    profiles are one organisation */}
			<JsonLd data={organizationJsonLd(siteUrl(), settings)} />
			<PageBuilder blocks={page.pageBuilder ?? []} />
		</>
	)
}
