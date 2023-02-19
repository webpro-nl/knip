module.exports = {
  root: true,
  extends: [
    require.resolve('./base.eslint.json'),
    'airbnb',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    '@scope/eslint-config/file',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'prettier'],
};
