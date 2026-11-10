export default {
  plugins: [
    'prettier-plugin-xml',
    import.meta.resolve('prettier-plugin-astro'),
    './scripts/prettier-plugin-sort-json.js',
  ],
  overrides: [{ options: { plugins: ['prettier-plugin-java'] } }],
};
