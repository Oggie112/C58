import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { getAllPostSlugs, getPostBySlug } from '@/sanity/fetch'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import portableTextComponents from '@/lib/portableTextComponents'

export async function generateStaticParams() {
	return await getAllPostSlugs({ perspective: 'published', stega: false })
}

export async function generateMetadata(
	{ params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
	const { slug } = await params
	const post = await getPostBySlug(slug)
	if (!post) return {}

	const ogImage = post.image
		? urlFor(post.image).width(1200).height(630).url()
		: undefined

	return {
		title: post.title,
		openGraph: {
			title: post.title,
			...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
		},
	}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const post = await getPostBySlug(slug)

	if (!post) notFound()

	const imageUrl = post.image
		? urlFor(post.image).width(1200).height(675).url()
		: null

	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="mb-10">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					<span className="font-body text-label text-c58-ice uppercase tracking-[0.15em] block mb-4">
						{formatEventDate(post.date)}
					</span>
					<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
						{post.title}
					</h1>
				</div>

				{imageUrl && (
					<div className="relative w-full aspect-video mb-12 overflow-hidden">
						<Image
							src={imageUrl}
							alt={`Image for ${post.title}`}
							fill
							priority
							className="object-cover"
						/>
					</div>
				)}

				{post.body && (
					<PortableText value={post.body} components={portableTextComponents} />
				)}
			</div>
		</article>
	)
}
