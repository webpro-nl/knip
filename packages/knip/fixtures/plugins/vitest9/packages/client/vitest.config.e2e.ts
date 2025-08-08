export default {
  test: {
    name: 'client-e2e',
    include: ['e2e/**/*.test.ts'],
    setupFiles: ['./e2e-setup.ts'],
    environment: 'happy-dom',
  },
};
