export default {
  optimizeDeps: {
    include: ['top-level-dep'],
  },
  test: {
    projects: [
      {
        extends: './vitest.shared.config.ts',
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
      {
        extends: true,
        test: {
          include: ['src/**/*.inherited.test.ts'],
          name: 'inherited',
        },
      },
      'packages/*/vitest.config.e2e.ts',
    ],
    coverage: {
      enabled: false,
    },
  },
};
