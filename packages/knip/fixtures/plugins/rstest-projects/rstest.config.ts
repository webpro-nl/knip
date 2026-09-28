import { defineConfig } from '@rstest/core';

export default defineConfig({
  coverage: {
    provider: 'v8',
  },
  projects: [
    'packages/*',
    '!packages/excluded',
    '<rootDir>/services/auth/rstest.config.ts',
    {
      name: 'dom',
      root: 'dom',
      include: ['**/*.dom.ts'],
      setupFiles: './dom-setup.ts',
      testEnvironment: 'jsdom',
      resolve: {
        alias: {
          '@theme': './theme',
        },
      },
    },
    {
      name: 'client',
      include: ['app/*.test.ts', '!app/*.ssr.test.ts'],
    },
    {
      name: 'ssr',
      include: ['app/*.ssr.test.ts'],
    },
  ],
});
