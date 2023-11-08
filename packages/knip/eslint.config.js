// @ts-check

import baseConfig from '@knip/eslint-config';

/**
 * @type {import("@knip/eslint-config").FlatConfig[]}
 */
const config = [
  ...baseConfig,
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./scripts/tsconfig.json'],
      },
    },
    rules: {
      'n/no-restricted-import': 'off',
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./test/tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];

export default config;
