export default {
  test: {
    projects: [
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.ts'],
          setupFiles: ['./src/unit.setup.ts'],
          environment: 'jsdom',
        },
      },
      'packages/*/vitest.config.e2e.ts',
    ],
    coverage: {
      enabled: false,
    },
  },
};
