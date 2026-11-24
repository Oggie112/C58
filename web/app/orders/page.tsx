import type { Metadata } from 'next'
import ResendForm from './ResendForm'

export const metadata: Metadata = {
	title: 'Resend your tickets',
}

// Lost the confirmation email? (8UI.3) Email in, tickets resent to that
// address — the page never shows order details, so knowing someone's email
// gets you nothing but sending them their own tickets.
export default function ResendTicketsPage() {
	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">Tickets</p>
				<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					Resend your tickets
				</h1>
				<p className="font-body text-body text-c58-muted leading-[1.7] mb-12">
					Can&apos;t find your confirmation email? Enter the address you bought with and we&apos;ll send the
					tickets for any upcoming events again.
				</p>
				<ResendForm />
			</div>
		</article>
	)
}
