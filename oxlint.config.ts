import e18e from '@e18e/eslint-plugin';
import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'import'],
  jsPlugins: ['@e18e/eslint-plugin'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'no-console': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-param-reassign': 'off',
    'dot-notation': 'off',
    'array-callback-return': 'off',
    ...e18e.configs.recommended.rules,
    'e18e/prefer-array-at': 'off',
    'e18e/prefer-spread-syntax': 'off',
    'e18e/prefer-static-regex': 'off',
    'e18e/no-delete-property': 'error',
    'e18e/no-spread-in-reduce': 'error',
    'e18e/prefer-charcode-at-in-loop': 'error',
    'e18e/prefer-exponentiation-operator': 'error',
    'e18e/prefer-flatmap-over-map-flat': 'error',
    'e18e/prefer-includes-over-regex-test': 'error',
    'e18e/prefer-inline-equality': 'error',
    'e18e/prefer-slice-over-split-index': 'error',
    'e18e/prefer-static-collator': 'error',
    'e18e/prefer-throw-if-no-entry': 'error',
  },
  ignorePatterns: ['**/dist', '**/tmp', '**/vendor', 'packages/docs/.astro', '.vscode', 'templates'],
  overrides: [
    {
      files: ['**/*.astro'],
      rules: { 'no-unused-vars': 'off' },
    },
    {
      files: ['packages/knip/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'node:path',
                message: 'Please use src/util/path.js instead.',
              },
              {
                name: 'path',
                message: 'Please use src/util/path.js instead.',
              },
              {
                name: 'node:assert',
                message: 'Please use node:assert/strict instead.',
              },
            ],
          },
        ],
        'import/extensions': ['error', 'always', { ignorePackages: true }],
      },
    },
    {
      files: ['packages/docs/**', 'packages/create-config/**'],
      rules: { 'no-restricted-imports': 'off', 'no-console': 'off' },
    },
    {
      files: ['packages/language-server/**'],
      rules: { 'no-console': 'off' },
    },
    {
      files: [
        'packages/knip/src/reporters/**',
        'packages/knip/scripts/**',
        'packages/vscode-knip/scripts/**',
        'packages/vscode-knip/test/**',
      ],
      rules: { 'no-console': 'off' },
    },
    {
      files: ['packages/vscode-knip/scripts/publish.js'],
      rules: { 'e18e/no-delete-property': 'off' },
    },
    {
      files: ['packages/knip/fixtures/**'],
      rules: {
        'e18e/ban-dependencies': 'off',
        'e18e/prefer-array-from-map': 'off',
        'e18e/prefer-includes': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'no-console': 'off',
        'no-duplicate-enum-values': 'off',
        'no-restricted-imports': 'off',
        'triple-slash-reference': 'off',
        'import/namespace': 'off',
        'import/extensions': 'off',
      },
    },
  ],
});
