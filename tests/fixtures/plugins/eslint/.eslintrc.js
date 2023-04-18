module.exports = {
  root: true,
  extends: [
    require.resolve('./base.eslint.json'),
    'airbnb',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'next/core-web-vitals',
    'plugin:@next/next/core-web-vitals',
    'plugin:eslint-comments/recommended',
    'plugin:eslint-plugin/all',
    '@scope/eslint-config/file',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'prettier', 'eslint-plugin-cypress', '@scope/eslint-plugin'],
  settings: {
    'import/resolver': {
      typescript: true,
      exports: true,
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
