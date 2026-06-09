import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAllTalentSlugs, getTalentBySlug } from '@/sanity/fetch'
import { urlFor } from '@/sanity/image'

export async function generateStaticParams() {
	return await getAllTalentSlugs({ perspective: 'published', stega: false })
}

export async function generateMetadata(
	{ params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
	const { slug } = await params
	const talent = await getTalentBySlug(slug)
	if (!talent) return {}

	const ogImage = talent.photo
		? urlFor(talent.photo).width(1200).height(630).url()
		: undefined

	return {
		title: talent.name,
		description: talent.bio ?? undefined,
		openGraph: {
			title: talent.name,
			...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
		},
	}
}

export default async function TalentPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const talent = await getTalentBySlug(slug)

	if (!talent) notFound()

	const imageUrl = talent.photo
		? urlFor(talent.photo).width(800).height(1000).url()
		: null

	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">

					{/* Photo */}
					<div className="relative w-full aspect-[4/5] overflow-hidden bg-c58-void">
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={`Photo of ${talent.name}`}
								fill
								priority
								className="object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<span className="font-display font-bold text-display uppercase tracking-[0.04em] text-c58-ghost">
									{talent.name.charAt(0)}
								</span>
							</div>
						)}
					</div>

					{/* Info */}
					<div className="md:pt-4">
						<div className="w-15 h-px bg-c58-ice mb-6" />

						{talent.role && (
							<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">
								{talent.role}
							</p>
						)}

						<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-8">
							{talent.name}
						</h1>

						{talent.bio && (
							<p className="font-body text-body text-c58-muted leading-[1.7] mb-10">
								{talent.bio}
							</p>
						)}

						{talent.socialLinks && talent.socialLinks.length > 0 && (
							<ul className="flex flex-wrap gap-3">
								{talent.socialLinks.map((link) => (
									<li key={link.platform}>
										<Link
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="font-body text-label uppercase tracking-[0.15em] border border-c58-border text-c58-muted px-5 py-2.5 inline-block hover:border-c58-ice-border hover:text-c58-white transition-colors duration-200"
										>
											{link.platform}
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</article>
	)
}
