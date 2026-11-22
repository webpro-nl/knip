import { defineConfig } from 'vite-plus';
import { baseLint } from './tooling/lint/base';
import { nodeLint } from './tooling/lint/node';
import { reactLint } from './tooling/lint/react';

export default defineConfig({
  lint: {
    ...baseLint,
    overrides: [
      {
        files: ['apps/web/**'],
        ...reactLint,
      },
      {
        files: ['apps/api/**'],
        ...nodeLint,
      },
    ],
  },
});
