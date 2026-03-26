import type { Config } from 'jest'

const config: Config = {
	projects: [
		{	
			displayName: 'node',
			preset: 'ts-jest',
			testEnvironment: 'node',
			testMatch: ['**/*.test.ts'],
			moduleNameMapper: {
				'^next-sanity$': '<rootDir>/__mocks__/next-sanity.ts',
			}
		},
		{
			displayName: "jsdom",
			preset: 'ts-jest',
			testEnvironment: 'jsdom',
			testMatch: ["**/*.test.tsx"],
			moduleNameMapper: {
				'^@/sanity/image$': '<rootDir>/__mocks__/sanity/image.ts',
				'^@/(.*)$' : '<rootDir>/$1',
				'^next-sanity$': '<rootDir>/__mocks__/next-sanity.ts',
				'^next/image$': '<rootDir>/__mocks__/next/image.tsx',
				'^next/link$': '<rootDir>/__mocks__/next/link.tsx',
			},
			setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
		},
	]
}

export default config
