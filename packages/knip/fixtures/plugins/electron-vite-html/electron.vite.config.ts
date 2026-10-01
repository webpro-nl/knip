import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: { rollupOptions: { input: 'src/main/index.ts' } },
  },
  preload: {
    build: { rollupOptions: { input: 'src/preload/index.ts' } },
  },
});
