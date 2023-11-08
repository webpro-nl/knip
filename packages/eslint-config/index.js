// @ts-check

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import nPlugin from 'eslint-plugin-n';
import globals from 'globals';
import { resolve as tsResolver } from 'eslint-import-resolver-typescript';

// console.log(importPlugin);

/**
 * @type {import("@knip/eslint-config").FlatConfig[]}
 */
const baseConfig = [
  js.configs.recommended,
  ...tsPlugin.configs['eslint-recommended'].overrides,
  { rules: tsPlugin.configs.recommended.rules },
  importPlugin.configs.typescript,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json']
      },
      globals: globals.node
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tsPlugin,
      n: nPlugin
    },
    settings: {
      'import/resolver': {
        typescript: tsResolver
      }
    },
    rules: {
      'n/no-restricted-import': [
        'error',
        [
          {
            name: ['path', 'node:path'],
            message: 'Please use src/util/path.js instead.'
          }
        ]
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', ['external', 'internal'], 'parent', 'sibling', 'index', 'object', 'unknown', 'type'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never'
        }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'import/no-unresolved': 'error'
    }
  }
];

export default baseConfig;
