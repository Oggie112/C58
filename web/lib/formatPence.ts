// Prices are stored in pence everywhere outside Sanity; shared by the order
// page and the confirmation email so the two can't format money differently.
export function formatPence(pence: number): string {
	return `£${(pence / 100).toFixed(2)}`
}
