// The calendar date of a moment, as seen in the UK (Europe/London follows
// the GMT/BST switch), as YYYY-MM-DD. For dates taken from an instant —
// "what day was it here?" — where UTC would roll over at 1am in summer.
// en-CA is used only because it formats as YYYY-MM-DD.
export function londonDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(instant)
}

export function formatEventDate(isoDate: string): string {
	return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}
