import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.config(eslint.configs.recommended, tseslint.configs.recommended),
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {},
  },
];
