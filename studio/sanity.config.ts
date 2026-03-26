import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {BookIcon} from '@sanity/icons'
import {schemaTypes} from './schemaTypes'
import {resolve} from './presentation/resolve'
import {CmsGuide} from './tools/CmsGuide'

const SINGLETON_TYPES = new Set(['siteSettings'])
const ORDERABLE_TYPES = new Set(['teamMember'])

export default defineConfig({
	name: 'default',
	title: 'C58',

	projectId: 'zrs5rii4',
	dataset: 'production',

	plugins: [
		structureTool({
			structure: (S, context) =>
				S.list()
					.title('Content')
					.items([
						...S.documentTypeListItems().filter(
							(item) => !SINGLETON_TYPES.has(item.getId() ?? '') && !ORDERABLE_TYPES.has(item.getId() ?? ''),
						),
						orderableDocumentListDeskItem({S, context, type: 'teamMember', title: 'Team Members'}),
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
		presentationTool({
			resolve,
			previewUrl: {
				initial: process.env.SANITY_STUDIO_PREVIEW_URL ?? 'http://localhost:3000',
				previewMode: {
					enable: '/api/draft-mode/enable',
				},
			},
		}),
		visionTool(),
	],
	tools: [
				{
			name: 'cms-guide',
			title: 'Guide',
			icon: BookIcon,
			component: CmsGuide,
		},
	],
	schema: {
		types: schemaTypes,
	},
})
