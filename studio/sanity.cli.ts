import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'zrs5rii4',
    dataset: 'production'
  },
  deployment: {
    appId: 'oqeqdkmp0ztxamyqy6r5slh0',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})
