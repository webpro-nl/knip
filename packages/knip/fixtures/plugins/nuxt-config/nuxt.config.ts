export default defineNuxtConfig({
  extends: ['~~/some-layer'],
  modules: ['a-module', '~~/local-module'],
  dir: {
    plugins: 'my-plugins',
  },
  components: ['~/components', '~/other-components'],
});
