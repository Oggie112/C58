interface SectionMarkerProps {
	number?: string
	className?: string
}

export default function SectionMarker({ number, className = 'mb-6' }: SectionMarkerProps) {
	if (!number) {
		return <div className={`w-15 h-px bg-c58-ice ${className}`} />
	}

	return (
		<div className={`flex items-center gap-4 ${className}`}>
			<span className="font-body text-label text-c58-ice tracking-[0.15em]">{number}</span>
			<div className="w-15 h-px bg-c58-ice" />
		</div>
	)
}
