// Documents
import {page} from './documents/page'
import {event} from './documents/event'
import {post} from './documents/post'
import {teamMember} from './documents/team-member'
import {volunteer} from './documents/volunteer'
import {talent} from './documents/talent'
import {partner} from './documents/partner'
import {siteSettings} from './documents/site-settings'

// Blocks
import {heroBlock} from './blocks/hero-block'
import {nextEventBlock} from './blocks/next-event-block'
import {featuredUpdateBlock} from './blocks/featured-update-block'
import {blogListBlock} from './blocks/blog-list-block'
import {talentListBlock} from './blocks/talent-list-block'
import {partnersBlock} from './blocks/partners-block'
import {eventListBlock} from './blocks/event-list-block'
import {richTextBlock} from './blocks/rich-text-block'
import {teamBlock} from './blocks/team-block'
import {volunteerBlock} from './blocks/volunteer-block'
import {contactBlock} from './blocks/contact-block'
import {imageBlock} from './blocks/image-block'

// Objects
import {bgMedia} from './objects/bg-media'

export const schemaTypes = [
	// Documents
	page,
	event,
	post,
	teamMember,
	volunteer,
	talent,
	partner,
	siteSettings,
	// Blocks
	heroBlock,
	nextEventBlock,
	featuredUpdateBlock,
	blogListBlock,
	talentListBlock,
	partnersBlock,
	eventListBlock,
	richTextBlock,
	teamBlock,
	volunteerBlock,
	contactBlock,
	imageBlock,
	// Objects
	bgMedia,
]
