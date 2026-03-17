import type { Metadata } from "next"
import { getPageBySlug } from "@/sanity/fetch"
import PageBuilder from "@/app/components/PageBuilder"
import { urlFor } from "@/sanity/image"

const HOME_SLUG = "home"

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPageBySlug(HOME_SLUG, { stega: false })
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
	const page = await getPageBySlug(HOME_SLUG)
	if (!page) return <div>Home page not found — create a page in Sanity with the slug &quot;home&quot;.</div>
	return <PageBuilder blocks={page.pageBuilder ?? []} />
}
