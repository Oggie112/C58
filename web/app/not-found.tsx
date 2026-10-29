import Link from 'next/link'

export default function NotFound() {
	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">404</p>
				<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					Page not found
				</h1>
				<p className="font-body text-body text-c58-muted leading-[1.7] mb-12">
					This page doesn&apos;t exist or has moved.
				</p>
				<Link
					href="/"
					className="font-body text-label uppercase tracking-[0.15em] text-c58-ice hover:text-c58-white transition-colors duration-200"
				>
					← Back to home
				</Link>
			</div>
		</article>
	)
}
