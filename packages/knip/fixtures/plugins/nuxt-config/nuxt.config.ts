export default defineNuxtConfig({
  extends: ['~~/some-layer', 'a-nuxt-theme'],
  modules: ['a-module', '~~/local-module'],
  dir: {
    plugins: 'my-plugins',
  },
  plugins: ['my-plugins/custom/deep', { src: '~/my-plugins/custom/client.js', mode: 'client' }],
  components: ['~/components', '~/other-components'],
  imports: {
    dirs: ['custom-utils'],
  },
});
