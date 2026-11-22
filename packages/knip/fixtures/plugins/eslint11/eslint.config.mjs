import babelParser from '@babel/eslint-parser';

const parserOptions = {
  requireConfigFile: false,
  babelOptions: {
    plugins: [['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }], 'transform-class-properties'],
    presets: ['@babel/env'],
  },
};

export default [
  {
    files: ['**/*.js'],
    languageOptions: { parser: babelParser, parserOptions },
  },
];
