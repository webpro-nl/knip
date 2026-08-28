export default defineNuxtConfig({
  extends: ['~~/some-layer', 'a-nuxt-theme'],
  modules: ['a-module', '~~/local-module'],
  dir: {
    plugins: 'my-plugins',
  },
  components: ['~/components', '~/other-components'],
  imports: {
    dirs: ['custom-utils'],
  },
});
