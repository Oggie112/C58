// The order page reads live state per request (see page.tsx), so under Cache
// Components it needs a Suspense boundary — this file is it. Shown while the
// order loads and, if pending, is confirmed with SumUp.
export default function OrderLoading() {
	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white animate-pulse">
					Loading your order
				</h1>
			</div>
		</article>
	)
}
