import { defineLive } from 'next-sanity/live'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
	client,
	serverToken: process.env.SANITY_API_READ_TOKEN,
	browserToken: process.env.NEXT_PUBLIC_SANITY_VIEWER_TOKEN,
	// Every sanityFetch must pass perspective and stega, and <SanityLive>
	// includeDrafts. Under Cache Components sanityFetch no longer reads draft
	// mode itself, so a missing option would silently serve published content
	// to Presentation — strict turns that into an error.
	strict: true,
})
