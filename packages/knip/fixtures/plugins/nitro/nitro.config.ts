import { defineNitroConfig } from 'nitropack/config';

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: '2025-12-13',
  srcDir: 'server',
  imports: false,
});
