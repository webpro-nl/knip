import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: { entry: { client: './src/client.ts' } },
  resolve: {
    alias: {
      '@env': `${import.meta.dirname}/src/env.ts`,
      '@lib': './src/lib',
    },
  },
  environments: {
    node: { resolve: { alias: { '@server': './src/server.ts' } } },
  },
});
