import { getAllPageSlugs, getPageBySlug } from "@/sanity/fetch";
import PageBuilder  from "@/app/components/PageBuilder";

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