import { randomBytes } from 'node:crypto'

// Secret for the order page URL (/orders/[token]) — anyone holding it can
// see the order's tickets. 256 bits, base64url so it's URL-safe as-is
// (43 chars, no padding).
export function generateAccessToken(): string {
	return randomBytes(32).toString('base64url')
}
