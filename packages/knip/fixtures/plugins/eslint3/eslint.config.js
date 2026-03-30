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
]);
