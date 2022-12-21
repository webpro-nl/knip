module.exports = {
  root: true,
  extends: [
    './base.eslint.json',
    'airbnb',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    '@scope/eslint-config/ts',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'prettier'],
};
