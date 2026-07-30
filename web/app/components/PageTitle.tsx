interface PageTitleProps {
	title: string
	subtitle?: string
	className?: string
}

export default function PageTitle({ title, subtitle, className = 'mb-16' }: PageTitleProps) {
	return (
		<div className={className}>
			<div className="w-15 h-px bg-c58-ice mb-6" />
			<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
				{title}
			</h2>
			{subtitle && (
				<p className="font-body text-body text-c58-muted leading-[1.7] max-w-[560px] mt-6">
					{subtitle}
				</p>
			)}
		</div>
	)
}
