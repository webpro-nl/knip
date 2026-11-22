import { defineConfig } from 'evalite/config';

export default defineConfig({
  setupFiles: ['dotenv/config', './setup.ts'],
});
