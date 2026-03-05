export function formatEventDate(isoDate: string): string {
	return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}
