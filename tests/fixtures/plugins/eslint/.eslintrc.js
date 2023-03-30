module.exports = {
  root: true,
  extends: [
    require.resolve('./base.eslint.json'),
    'airbnb',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@next/next/core-web-vitals',
    '@scope/eslint-config/file',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'prettier', 'eslint-plugin-cypress'],
};
