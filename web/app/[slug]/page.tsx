import type { Metadata } from "next"
import { getAllPageSlugs, getPageBySlug } from "@/sanity/fetch";
import PageBuilder from "@/app/components/PageBuilder";
import { urlFor } from "@/sanity/image";

// generateMetadata and the Page component both call getPageBySlug with the
// same slug. Next.js deduplicates identical fetch() calls within a single
// request, so no double network call occurs. If the site scales and response
// times become a concern, consider adding { next: { revalidate: 3600 } } to
// the Sanity client fetch calls to enable ISR-style caching.
export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const { slug } = await params
    const page = await getPageBySlug(slug)
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

export async function generateStaticParams() {
    const slugs = await getAllPageSlugs();
    return slugs
}

export default async function Page({ params }: { params: { slug: string }}) {
    const { slug } = await params
    const page = await getPageBySlug(slug)
    if (!page) {
        return <div>Page not found</div>
    }
    return <PageBuilder blocks={page.pageBuilder ?? []} />
}