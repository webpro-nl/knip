const less = require('postcss-less');
const stylus = require('postcss-styl');
const myCustomPlugin = require('./myCustomPlugin');

/** @type {import('stylelint').Config} */
const config = {
  customSyntax: less,
  extends: [require.resolve('stylelint-config-recommended'), './myExtendableConfig'],
  plugins: ['./myCustomPlugin.js'],
  rules: {
    'alpha-value-notation': 'number',
  },
  overrides: [
    {
      plugins: ['./myCustomPlugin.js', myCustomPlugin],
    },
    {
      files: ['**/*.html'],
      extends: ['stylelint-config-html/html', 'stylelint-config-standard'],
    },
    {
      files: ['*.styl', '**/*.styl', '*.stylus', '**/*.stylus'],
      customSyntax: stylus,
    },
  ],
};

module.exports = config;
