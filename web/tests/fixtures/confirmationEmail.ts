import type { ConfirmationEmailInput } from '@/lib/confirmationEmail'

export const orderUrl = 'https://www.c58.uk/orders/Abc123_-Abc123_-Abc123_-Abc123_-Abc123_-Abc'

export const event: NonNullable<ConfirmationEmailInput['event']> = {
	title: 'Beach Party',
	date: '2026-11-20',
	time: '22:00',
	location: 'Market Square, St Neots',
}

export const twoTicketOrder: ConfirmationEmailInput['order'] = {
	amountTotal: 3500,
	lines: [
		{ tierName: 'Early Bird', quantity: 1, unitPrice: 1500 },
		{ tierName: 'General', quantity: 1, unitPrice: 2000 },
	],
	tickets: [
		{ code: 'C58-9F2E61D0A7B3C415', tierName: 'Early Bird', status: 'valid' },
		{ code: 'C58-03BC7E1F88A24D6E', tierName: 'General', status: 'valid' },
	],
}

export const singleTicketOrder: ConfirmationEmailInput['order'] = {
	amountTotal: 100,
	lines: [{ tierName: 'Test', quantity: 1, unitPrice: 100 }],
	tickets: [{ code: 'C58-11112222AAAABBBB', tierName: 'Test', status: 'valid' }],
}

// Sanity content is editor-controlled, not trusted markup.
export const hostileEvent: NonNullable<ConfirmationEmailInput['event']> = {
	title: '<script>alert(1)</script> & "Friends"\nBcc: attacker@example.com',
	date: '2026-11-20',
	location: '<img src=x onerror=alert(1)>',
}
