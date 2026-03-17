import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const isProduction = process.env.VERCEL_ENV === 'production'

	return {
		rules: {
			userAgent: '*',
			allow: isProduction ? '/' : undefined,
			disallow: isProduction ? undefined : '/',
		},
	}
}
