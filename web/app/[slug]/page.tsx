import type { Metadata } from "next"
import { getAllPageSlugs, getPageBySlug } from "@/sanity/fetch";
import PageBuilder from "@/app/components/PageBuilder";
import { urlFor } from "@/sanity/image";

export async function generateMetadata(
    { params }: { params: { slug: string } }
): Promise<Metadata> {
    const { slug } = await params
    const page = await getPageBySlug(slug, { stega: false })
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
    return await getAllPageSlugs({ perspective: 'published', stega: false })
}

export default async function Page({ params }: { params: { slug: string }}) {
    const { slug } = await params
    const page = await getPageBySlug(slug)
    if (!page) {
        return <div>Page not found</div>
    }
    return <PageBuilder blocks={page.pageBuilder ?? []} />
}
