import { RichTextBlock as RichTextBlockType } from '@/types/sanity'
import { PortableText, PortableTextComponents } from 'next-sanity'

const components: PortableTextComponents = {
	block: {
		normal: ({ children }) => (
			<p className="font-body text-body text-c58-muted leading-[1.7] mb-6 last:mb-0">
				{children}
			</p>
		),
		h1: ({ children }) => (
			<h1 className="font-display font-bold text-headline uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-6">
				{children}
			</h1>
		),
		h2: ({ children }) => (
			<h2 className="font-display font-bold text-subhead uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-4">
				{children}
			</h2>
		),
		h3: ({ children }) => (
			<h3 className="font-display font-bold text-body uppercase tracking-[0.04em] text-c58-white mb-4">
				{children}
			</h3>
		),
		blockquote: ({ children }) => (
			<blockquote className="font-body text-body text-c58-muted leading-[1.7] border-l border-c58-ice pl-6 mb-6">
				{children}
			</blockquote>
		),
	},
	marks: {
		strong: ({ children }) => (
			<strong className="text-c58-white font-medium">{children}</strong>
		),
		// No em — design spec prohibits italics. Render as plain text.
		em: ({ children }) => <>{children}</>,
		link: ({ value, children }) => (
			<a
				href={value?.href}
				target={value?.href?.startsWith('http') ? '_blank' : undefined}
				rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
				className="text-c58-ice hover:underline hover:underline-offset-[3px] transition-colors duration-200"
			>
				{children}
			</a>
		),
	},
	list: {
		bullet: ({ children }) => (
			<ul className="font-body text-body text-c58-muted leading-[1.7] mb-6 space-y-2 list-none">
				{children}
			</ul>
		),
		number: ({ children }) => (
			<ol className="font-body text-body text-c58-muted leading-[1.7] mb-6 space-y-2 list-none [counter-reset:item]">
				{children}
			</ol>
		),
	},
	listItem: {
		bullet: ({ children }) => (
			<li className="pl-4 before:content-['—'] before:text-c58-ice before:mr-3">
				{children}
			</li>
		),
		number: ({ children }) => (
			<li className="pl-4 before:content-[counter(item)_'.'] before:text-c58-ice before:mr-3 [counter-increment:item]">
				{children}
			</li>
		),
	},
}

export default function RichTextBlock({ block }: { block: RichTextBlockType }) {
	if (!block.body) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[560px] mx-auto">
				<PortableText value={block.body} components={components} />
			</div>
		</section>
	)
}
