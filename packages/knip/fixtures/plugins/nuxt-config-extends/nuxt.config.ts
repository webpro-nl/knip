export default defineNuxtConfig({
  extends: [
    ['./tuple-layer', { install: true }],
    { source: './object-layer' },
    'github:nuxt-themes/docus',
    'a-nuxt-theme',
  ],
});
