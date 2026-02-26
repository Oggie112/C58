// Documents
import {page} from './documents/page'
import {event} from './documents/event'
import {post} from './documents/post'
import {teamMember} from './documents/team-member'
import {siteSettings} from './documents/site-settings'

// Blocks
import {heroBlock} from './blocks/hero-block'
import {nextEventBlock} from './blocks/next-event-block'
import {featuredPostBlock} from './blocks/featured-post-block'
import {eventListBlock} from './blocks/event-list-block'
import {richTextBlock} from './blocks/rich-text-block'
import {teamBlock} from './blocks/team-block'
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
	siteSettings,
	// Blocks
	heroBlock,
	nextEventBlock,
	featuredPostBlock,
	eventListBlock,
	richTextBlock,
	teamBlock,
	contactBlock,
	imageBlock,
	// Objects
	bgMedia,
]
