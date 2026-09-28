import { defineConfig } from '@rstest/core';

export default defineConfig({
  resolve: {
    alias: {
      '@app': './src',
      'fruit$': './src/utils/fruit.ts',
      '@lib': ['./missing', './lib'],
      'ignored-module': false,
    },
  },
});
