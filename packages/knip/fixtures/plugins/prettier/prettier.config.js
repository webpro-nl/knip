export default {
  plugins: ['prettier-plugin-xml', import.meta.resolve('prettier-plugin-astro')],
  overrides: [{ options: 'prettier-plugin-java' }],
};
