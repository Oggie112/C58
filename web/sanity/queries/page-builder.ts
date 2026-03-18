import { defineQuery } from 'next-sanity'

// Fetch a single page by slug with all page builder blocks expanded.
// References inside featuredPostBlock and teamBlock are resolved inline.
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
				}
			},
			_type == "featuredPostBlock" => {
				"post": post-> {
					_id, _type, title, slug, date, image, body
				}
			},
			_type == "teamBlock" => {
				"members": *[_type == "teamMember"] | order(orderRank) {
					_id, _type, name, role, bio, photo
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
