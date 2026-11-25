// Renders schema.org structured data (see lib/structuredData.ts) as Next's
// JSON-LD guide recommends. JSON.stringify doesn't escape HTML, and the data
// comes from Sanity: a title containing "</script>" would otherwise end the
// tag and let whatever follows run as markup. Replacing every "<" with its
// JSON unicode escape keeps the JSON identical and the tag unbreakable.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
		/>
	)
}
