import { BlogListBlock as BlogListBlockType } from '@/types/sanity'
import { getAllPosts } from '@/sanity/fetch'
import PostCard from './PostCard'

export default async function BlogListBlock({ block }: { block: BlogListBlockType }) {
	let posts
	try {
		posts = await getAllPosts()
	} catch (error) {
		console.error('Failed to fetch posts:', error)
		return null
	}

	if (!posts.length) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{block.heading ?? 'LATEST POSTS'}
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{posts.map(post => (
						<PostCard key={post._id} post={post} />
					))}
				</div>
			</div>
		</section>
	)
}
