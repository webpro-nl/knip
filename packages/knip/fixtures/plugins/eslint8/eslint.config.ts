import js from '@eslint/js';
import oxcResolver from 'eslint-import-resolver-oxc';
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
  {
    files: ['**/*.{js,cjs,mjs}'],
    settings: {
      'import-x/resolver': { name: 'oxc', resolver: oxcResolver, enable: true, options: {} },
    },
  },
  {
    files: ['**/*.vue'],
    settings: {
      'import-x/resolver-legacy': ['node', { name: 'oxc', resolver: oxcResolver }],
    },
  },
];
