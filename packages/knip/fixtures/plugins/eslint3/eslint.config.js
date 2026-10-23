import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import noSecrets from 'eslint-plugin-no-secrets';

export default defineConfig([
  'eslint:recommended',
  {
    plugins: {
      prettier,
      'no-secrets': noSecrets,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@babel/eslint-parser',
      },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: {
          meta: { name: 'local-parser' },
          name: 'local-parser',
          parseForESLint() {},
        },
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: {
          ts: '@typescript-eslint/parser',
          js: 'espree',
        },
      },
    },
  },
]);
