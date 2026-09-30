import { randomBytes } from 'node:crypto'

export function generateTicketCode(): string {
	return `C58-${randomBytes(4).toString('hex').toUpperCase()}`
}
