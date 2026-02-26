import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const SINGLETON_TYPES = new Set(['siteSettings'])

export default defineConfig({
	name: 'default',
	title: 'C58',

	projectId: 'zrs5rii4',
	dataset: 'production',

	plugins: [
		structureTool({
			structure: (S) =>
				S.list()
					.title('Content')
					.items([
						...S.documentTypeListItems().filter(
							(item) => !SINGLETON_TYPES.has(item.getId() ?? ''),
						),
						S.divider(),
						S.listItem()
							.title('Site Settings')
							.id('siteSettings')
							.child(
								S.document()
									.schemaType('siteSettings')
									.documentId('siteSettings'),
							),
					]),
		}),
		visionTool(),
	],

	schema: {
		types: schemaTypes,
	},
})
