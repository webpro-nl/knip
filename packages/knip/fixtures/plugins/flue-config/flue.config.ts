import { defineConfig } from '@flue/runtime/config';

export default defineConfig({
  target: 'cloudflare',
  app: './server/routes.ts',
  cloudflare: './server/workers.ts',
  agents: 'assistants/*.ts',
});
