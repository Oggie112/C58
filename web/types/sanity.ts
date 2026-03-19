// TypeScript types matching the Sanity schema.
// Keep in sync with studio/schemaTypes/ when schema changes.

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface SanitySlug {
	current: string
}

export interface SanityReference {
	_ref: string
	_type: 'reference'
}

export interface SanityImageAsset {
	_ref: string
	_type: 'reference'
}

export interface SanityImageHotspot {
	x: number
	y: number
	width: number
	height: number
}

export interface SanityImageCrop {
	top: number
	bottom: number
	left: number
	right: number
}

export interface SanityImage {
	_type: 'image'
	asset: SanityImageAsset
	hotspot?: SanityImageHotspot
	crop?: SanityImageCrop
}

/** Minimal portable text block — covers standard Sanity block content arrays. */
export interface PortableTextBlock {
	_key: string
	_type: string
	[key: string]: unknown
}

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------

export interface BgMedia {
	mediaType: 'image' | 'video'
	image?: SanityImage
	video?: { asset?: { url: string } }
}

export interface SanityPageSeo {
	title?: string
	description?: string
	image?: SanityImage
}

// ---------------------------------------------------------------------------
// Page builder blocks
// ---------------------------------------------------------------------------

export interface HeroBlock {
	_type: 'heroBlock'
	_key: string
	bgMedia?: BgMedia
	overlayText?: string
	contentType?: 'nextEvent' | 'featuredPost'
	post?: SanityPost
}

export interface NextEventBlock {
	_type: 'nextEventBlock'
	_key: string
}

export interface FeaturedUpdateBlock {
	_type: 'featuredUpdateBlock'
	_key: string
	heading?: string
	contentType: 'nextEvent' | 'featuredPost'
	post?: SanityPost
}

export interface FeaturedPostBlock {
	_type: 'featuredPostBlock'
	_key: string
	heading?: string
	post: SanityPost
}

export interface EventListBlock {
	_type: 'eventListBlock'
	_key: string
	showPast?: boolean
}

export interface RichTextBlock {
	_type: 'richTextBlock'
	_key: string
	body?: PortableTextBlock[]
}

export interface TeamBlock {
	_type: 'teamBlock'
	_key: string
	heading?: string
	members?: SanityTeamMember[]
}

export interface ContactBlock {
	_type: 'contactBlock'
	_key: string
	showMap?: boolean
}

export interface ImageBlock {
	_type: 'imageBlock'
	_key: string
	image: SanityImage
	caption?: string
}

export interface BlogListBlock {
	_type: 'blogListBlock'
	_key: string
	heading?: string
}

export type PageBuilderBlock =
	| HeroBlock
	| NextEventBlock
	| FeaturedUpdateBlock
	| FeaturedPostBlock
	| EventListBlock
	| BlogListBlock
	| RichTextBlock
	| TeamBlock
	| ContactBlock
	| ImageBlock

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface SanityPage {
	_id: string
	_type: 'page'
	title: string
	slug: SanitySlug
	seo?: SanityPageSeo
	pageBuilder?: PageBuilderBlock[]
}

export interface SanityEvent {
	_id: string
	_type: 'event'
	title: string
	slug: SanitySlug
	date: string // ISO date string (YYYY-MM-DD)
	time?: string
	location?: string
	cost?: string
	image?: SanityImage
	description?: PortableTextBlock[]
}

export interface SanityPost {
	_id: string
	_type: 'post'
	title: string
	slug: SanitySlug
	date: string // ISO date string (YYYY-MM-DD)
	image?: SanityImage
	body?: PortableTextBlock[]
}

export interface SanityTeamMember {
	_id: string
	_type: 'teamMember'
	name: string
	role?: string
	bio?: string
	photo?: SanityImage
}

export interface SanityNavLink {
	label: string
	href: string
}

export interface SanitySocialLink {
	platform: string
	url: string
}

export interface SanitySiteSettings {
	_id: "siteSettings"
	_type: 'siteSettings'
	phone?: string
	email?: string
	address?: string
	navLinks?: SanityNavLink[]
	socialLinks?: SanitySocialLink[]
	privacyPolicySlug?: string | null
}
