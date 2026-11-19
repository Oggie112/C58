// The calendar date of a moment, as seen in the UK (Europe/London follows
// the GMT/BST switch), as YYYY-MM-DD. For dates taken from an instant —
// "what day was it here?" — where UTC would roll over at 1am in summer.
// en-CA is used only because it formats as YYYY-MM-DD.
export function londonDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(instant)
}

// A sale-window instant for display, e.g. "21 Nov, 7:00 pm" — always UK
// time, whatever the visitor's own timezone, as events are in the UK.
export function formatSaleTime(isoInstant: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	}).format(new Date(isoInstant))
}

export function formatEventDate(isoDate: string): string {
	return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}
