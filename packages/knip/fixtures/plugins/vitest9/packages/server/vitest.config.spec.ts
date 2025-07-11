export default {
  test: {
    name: 'server-spec',
    include: ['spec/**/*.test.ts'],
    setupFiles: ['./spec-setup.ts'],
    coverage: {
      provider: 'istanbul',
      enabled: true,
    },
  },
};
