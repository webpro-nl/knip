import { defineConfig } from '@rslib/core';

export default defineConfig([
  {
    source: {
      entry: { index: './src/index.ts' },
    },
    format: 'esm',
  },
  {
    source: {
      entry: { index: './src/index.ts' },
    },
    format: 'cjs',
  },
]);
