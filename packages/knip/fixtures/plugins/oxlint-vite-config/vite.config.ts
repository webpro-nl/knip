import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    plugins: ['unicorn', 'typescript'],
    jsPlugins: ['eslint-plugin-regexp', { name: 'e18e', specifier: '@e18e/eslint-plugin' }],
  },
});
