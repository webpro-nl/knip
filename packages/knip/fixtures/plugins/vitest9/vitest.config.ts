export default {
  test: {
    projects: [
      // Inline project configurations
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.ts'],
          setupFiles: ['./src/unit.setup.ts'],
          environment: 'jsdom',
        },
      },
      {
        name: 'integration',
        test: {
          include: ['tests/**/*.integration.test.ts'],
          setupFiles: ['./src/integration.setup.ts'],
          globalSetup: './src/global.setup.ts',
        },
      },
      // External project configurations via glob patterns
      'packages/*/vitest.config.{e2e,spec}.ts',
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
    },
  },
};
