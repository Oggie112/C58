import { defineQuery } from 'next-sanity'
import { EVENT_CARD_FIELDS } from './events'

// Fetch a single page by slug with all page builder blocks expanded.
// Every block's data — references and collections alike — is resolved here,
// so blocks are purely presentational and the page is one Sanity request.
// $today (YYYY-MM-DD) splits events into upcoming and past.
export const PAGE_BY_SLUG_QUERY = defineQuery(/* groq */ `
	*[_type == "page" && slug.current == $slug][0] {
		_id,
		_type,
		title,
		slug,
		seo {
			title,
			description,
			image
		},
		pageBuilder[] {
			...,
			_type == "heroBlock" => {
				...,
				bgMedia {
					...,
					video {
						asset-> { url }
					}
				},
				"post": post-> {
					_id, _type, title, slug, date, image, body
				},
				contentType == "nextEvent" => {
					"nextEvent": *[_type == "event" && date >= $today] | order(date asc)[0] { ${EVENT_CARD_FIELDS} }
				}
			},
			_type == "featuredUpdateBlock" => {
				heading,
				contentType,
				"post": post-> {
					_id, _type, title, slug, date, image, body
				},
				contentType == "nextEvent" => {
					"nextEvent": *[_type == "event" && date >= $today] | order(date asc)[0] { ${EVENT_CARD_FIELDS} }
				}
			},
			_type == "eventListBlock" => {
				...,
				"upcomingEvents": *[_type == "event" && date >= $today] | order(date asc) { ${EVENT_CARD_FIELDS} },
				"pastEvents": *[_type == "event" && date < $today] | order(date desc) { ${EVENT_CARD_FIELDS} }
			},
			_type == "blogListBlock" => {
				...,
				"posts": *[_type == "post"] | order(date desc) {
					_id, _type, title, slug, date, image, body
				}
			},
			_type == "talentListBlock" => {
				...,
				"talents": *[_type == "talent"] | order(orderRank) {
					_id, _type, name, slug, role, bio, photo,
					socialLinks[] { platform, url }
				}
			},
			_type == "partnersBlock" => {
				...,
				"partners": *[_type == "partner"] | order(orderRank) {
					_id, _type, name, logo, website, description
				}
			},
			_type == "contactBlock" => {
				...,
				"settings": *[_id == "siteSettings"][0] { email, phone, address }
			},
			_type == "featuredPostBlock" => {
				heading,
				"post": post-> {
					_id, _type, title, slug, date, image, body
				}
			},
			_type == "teamBlock" => {
				...,
				"members": *[_type == "teamMember"] | order(orderRank) {
					_id, _type, name, role, photo
				}
			},
			_type == "volunteerBlock" => {
				...,
				"volunteers": *[_type == "volunteer"] | order(orderRank) {
					_id, _type, name, photo
				}
			},
			_type == "instagramBlock" => {
				...,
				"instagramUrl": *[_type == "siteSettings"][0].socialLinks[lower(platform) == "instagram"][0].url
			},
			_type == "imageBlock" => {
				...,
				image {
					...,
					asset->{
						...,
						metadata { dimensions }
					}
				}
			}
		}
	}
`)

// Fetch all page slugs — used for static route generation.
export const ALL_PAGE_SLUGS_QUERY = defineQuery(/* groq */ `
	*[_type == "page" && defined(slug.current)] {
		"slug": slug.current
	}
`)
