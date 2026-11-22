import { defineConfig } from 'vite-plus';
import { lint as base } from './tooling/lint/base.ts';
import { testLint } from './tooling/lint/test.ts';

const lint = {
  ...base,
  ...testLint,
};

export default defineConfig({
  lint,
});
