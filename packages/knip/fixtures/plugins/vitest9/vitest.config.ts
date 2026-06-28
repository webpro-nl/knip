export default {
  optimizeDeps: {
    include: ['top-level-dep'],
  },
  test: {
    projects: [
      {
        name: 'unit',
        resolve: {
          dedupe: ['project-dedupe-dep'],
        },
        optimizeDeps: {
          include: ['project-level-dep'],
        },
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
