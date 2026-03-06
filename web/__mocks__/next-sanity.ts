// Shim for next-sanity in Jest (ESM-only package, not parseable in CJS mode).
// defineQuery is an identity tag — it just returns the GROQ string unchanged.
export const defineQuery = (strings: TemplateStringsArray | string): string => {
	if (typeof strings === 'string') return strings
	return strings.join('')
}
