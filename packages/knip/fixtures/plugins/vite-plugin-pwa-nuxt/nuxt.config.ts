export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
  },
});
