import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const isProduction = process.env.VERCEL_ENV === 'production'

	return {
		rules: {
			userAgent: '*',
			allow: isProduction ? '/' : undefined,
			disallow: isProduction ? undefined : '/',
		},
		// Production only — previews are disallowed and shouldn't advertise one
		...(isProduction && { sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml` }),
	}
}
