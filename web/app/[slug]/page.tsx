import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPageSlugs, getPageBySlug } from "@/sanity/fetch";
import { getDynamicFetchOptions, getMetadataFetchOptions, PUBLISHED_FETCH_OPTIONS } from "@/sanity/fetchOptions";
import PageBuilder from "@/app/components/PageBuilder";
import { urlFor } from "@/sanity/image";
import { shareMetadata } from "@/lib/shareMetadata";

export async function generateMetadata(
	{ params }: PageProps<'/[slug]'>
): Promise<Metadata> {
	const { slug } = await params
	const page = await getPageBySlug(slug, await getMetadataFetchOptions())
	if (!page) return {}

	const seoImage = page.seo?.image
		? urlFor(page.seo.image).width(1200).height(630).url()
		: undefined

	const title = page.seo?.title ?? page.title
	return {
		title,
		description: page.seo?.description,
		openGraph: shareMetadata({ title, description: page.seo?.description, imageUrl: seoImage }),
	}
}

export async function generateStaticParams() {
	return await getAllPageSlugs(PUBLISHED_FETCH_OPTIONS)
}

export default async function Page({ params }: PageProps<'/[slug]'>) {
	const { slug } = await params
	const page = await getPageBySlug(slug, await getDynamicFetchOptions())
	if (!page) notFound()
	return <PageBuilder blocks={page.pageBuilder ?? []} />
}
