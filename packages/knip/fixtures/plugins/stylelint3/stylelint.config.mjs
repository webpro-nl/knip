/** @type {import('stylelint').Config} */
export default {
  extends: [
    {
      extends: ['stylelint-config-recommended'],
      customSyntax: 'postcss-styled-syntax',
      plugins: ['stylelint-plugin-logical-css'],
      rules: {},
    },
  ],
};
