import Pages from 'vite-plugin-pages';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [Pages()],
  lint: {
    jsPlugins: ['eslint-plugin-regexp'],
  },
  test: {
    setupFiles: ['./setup.ts'],
  },
});
