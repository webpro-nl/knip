export default ({ ssrBuild }) => ({
  build: {
    lib: {
      entry: {
        main: ['./src/lib-entry.ts'],
      },
    },
  },
  test: {
    root: './tests',
    globalSetup: '../src/globalSetup.ts',
    reporters: ssrBuild ? ['../src/ssr-reporter.ts'] : [],
  },
});
