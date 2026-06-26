import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@hooks': path.resolve(__dirname, './hooks'),
    },
  },
});
