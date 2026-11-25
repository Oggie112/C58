import type { HeadingLevel } from '@/lib/pageHeading'

interface PageTitleProps {
	title: string
	subtitle?: string
	className?: string
	// 'h1' when this is the page's main heading — see lib/pageHeading.ts
	headingLevel?: HeadingLevel
}

export default function PageTitle({ title, subtitle, className = 'mb-16', headingLevel = 'h2' }: PageTitleProps) {
	const Heading = headingLevel
	return (
		<div className={className}>
			<div className="w-15 h-px bg-c58-ice mb-6" />
			<Heading className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
				{title}
			</Heading>
			{subtitle && (
				<p className="font-body text-body text-c58-muted leading-[1.7] max-w-[560px] mt-6">
					{subtitle}
				</p>
			)}
		</div>
	)
}
