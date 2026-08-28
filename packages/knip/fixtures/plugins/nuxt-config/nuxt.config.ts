export default defineNuxtConfig({
  extends: './configs/base',
  modules: ['a-module', '~~/local-module'],
  dir: {
    plugins: 'my-plugins',
  },
  components: ['~/components', '~/other-components'],
  imports: {
    dirs: ['custom-utils'],
  },
});
