import type { Config } from 'jest'

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^next-sanity$': '<rootDir>/__mocks__/next-sanity.ts',
	},
}

export default config
