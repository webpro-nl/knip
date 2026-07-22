import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  extends: ['./relative-layer'],
  modules: [
    '~~/extra-modules/analytics',
    ['~~/extra-modules/telemetry', {}],
    '~~/modules/default-source-consumer',
    'nuxt-module',
  ],
});
