import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    plugins: ['unicorn', 'typescript'],
    jsPlugins: [{ name: 'regexp', specifier: 'eslint-plugin-regexp' }],
  },
});
