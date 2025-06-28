import less from 'postcss-less';

/** @type {import('stylelint').Config} */
const config = {
  customSyntax: less,
  extends: ['stylelint-config-standard'],
  rules: {
    'alpha-value-notation': 'number',
  },
  overrides: [
    {
      files: ['**/*.html'],
      extends: ['stylelint-config-html/html.js', 'stylelint-config-standard'],
    },
  ],
};

export default config;
