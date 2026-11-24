import { headers } from 'next/headers'

// The visitor's IP, for the rate limit. x-vercel-forwarded-for over
// x-forwarded-for: identical on a plain Vercel deployment, but stays correct
// if a proxy ever sits in front — confirmed from Vercel's own docs that it
// overwrites (does not forward) a client-supplied x-forwarded-for,
// specifically to prevent spoofing.
export async function clientIp(): Promise<string> {
	const headersList = await headers()
	return headersList.get('x-vercel-forwarded-for') ?? headersList.get('x-forwarded-for') ?? 'unknown'
}
