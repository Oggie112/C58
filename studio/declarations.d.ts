declare module '*.md?raw' {
	const content: string
	export default content
}

// The Sanity CLI replaces `process.env.SANITY_STUDIO_*` references with their
// values at build time (a Vite `define`) — `process` itself doesn't exist in
// the browser. Declare only what's injected, so a typo or an unprefixed
// variable is a type error rather than a runtime crash.
declare const process: {
	readonly env: {
		readonly SANITY_STUDIO_PREVIEW_URL?: string
	}
}
