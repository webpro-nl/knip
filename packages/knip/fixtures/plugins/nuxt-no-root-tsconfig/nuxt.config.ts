import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  modules: ['~~/extra-modules/analytics', ['~~/extra-modules/telemetry', {}]],
});
