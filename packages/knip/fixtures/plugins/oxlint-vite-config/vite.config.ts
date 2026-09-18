import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    plugins: ['unicorn', 'typescript'],
    jsPlugins: ['eslint-plugin-regexp', { name: 'e18e', specifier: '@e18e/eslint-plugin' }],
    settings: {
      'import/resolver': { typescript: { project: 'tsconfig.json' } },
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
    },
  },
});
