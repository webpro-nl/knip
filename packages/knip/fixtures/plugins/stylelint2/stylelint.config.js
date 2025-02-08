const less = require('postcss-less');
const stylus = require('postcss-styl');

/** @type {import('stylelint').Config} */
const config = {
  customSyntax: less,
  extends: [require.resolve('stylelint-config-recommended'), './myExtendableConfig'],
  rules: {
    'alpha-value-notation': 'number',
  },
  overrides: [
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
