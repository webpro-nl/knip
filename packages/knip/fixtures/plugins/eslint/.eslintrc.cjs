module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:prettier/recommended',
    'eslint-config-airbnb',
    'plugin:@shopify/esnext',
    'next',
  ],
  plugins: ['eslint-plugin-import', '@scope/name', '@scope'],
};
