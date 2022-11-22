module.exports = {
  root: true,
  extends: [
    './base.eslint.json',
    'airbnb',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'prettier'],
};
