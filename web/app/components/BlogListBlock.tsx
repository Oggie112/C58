import { BlogListBlock as BlogListBlockType } from '@/types/sanity'
import { getAllPosts } from '@/sanity/fetch'
import PostCard from './PostCard'

function BlogListShell({ heading, children }: { heading: string; children: React.ReactNode }) {
	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{heading}
				</h2>
				{children}
			</div>
		</section>
	)
}

export default async function BlogListBlock({ block }: { block: BlogListBlockType }) {
	const heading = block.heading ?? 'LATEST POSTS'

	let posts
	try {
		posts = await getAllPosts()
	} catch (error) {
		console.error('Failed to fetch posts:', error)
		return (
			<BlogListShell heading={heading}>
				<div className="border border-c58-border p-8 md:p-12 text-center">
					<p className="font-body text-body text-c58-ghost">
						Something went wrong loading posts. Please try refreshing the page.
					</p>
				</div>
			</BlogListShell>
		)
	}

	if (!posts.length) {
		return (
			<BlogListShell heading={heading}>
				<div className="border border-c58-border p-8 md:p-12 text-center">
					<p className="font-body text-body text-c58-ghost">No posts published yet.</p>
				</div>
			</BlogListShell>
		)
	}

	return (
		<BlogListShell heading={heading}>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{posts.map(post => (
					<PostCard key={post._id} post={post} />
				))}
			</div>
		</BlogListShell>
	)
}
