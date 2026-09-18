import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x';

export default [
  js.configs.recommended,
  importX.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        typescript: { project: 'tsconfig.json' },
        node: true,
        webpack: { config: 'webpack.config.js' },
      },
    },
  },
];
