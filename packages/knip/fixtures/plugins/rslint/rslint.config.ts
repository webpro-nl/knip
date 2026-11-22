import { defineConfig, js, ts } from '@rslint/core';
import jsdoc from 'eslint-plugin-jsdoc';
import orchard from './rslint-plugin-orchard.mjs';

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  {
    plugins: { jsdoc, orchard },
    rules: {
      'jsdoc/no-types': 'error',
    },
  },
]);
