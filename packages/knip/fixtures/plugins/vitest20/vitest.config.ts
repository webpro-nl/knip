export default {
  test: {
    coverage: {
      provider: 'custom',
      customProviderModule: './coverage-provider.ts',
    },
  },
};
