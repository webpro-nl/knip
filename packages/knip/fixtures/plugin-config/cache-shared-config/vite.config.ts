import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    jsPlugins: ['eslint-plugin-regexp'],
  },
  test: {
    setupFiles: ['./setup.ts'],
  },
});
