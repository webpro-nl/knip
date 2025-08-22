import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './vite'),
      '@vite-component': path.resolve(__dirname, './vite/component'),
      '@vite-file': path.join(fileURLToPath(new URL('./vite/dir', import.meta.url)), 'file.ts'),
    },
  },
  test: {
    alias: {
      '~': path.resolve(__dirname, './vitest'),
      '~vitest-dir': fileURLToPath(new URL('./vitest/dir', import.meta.url)),
    },
  },
});
