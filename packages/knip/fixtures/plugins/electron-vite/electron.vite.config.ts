import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      rollupOptions: {
        input: { chat: 'src/preload/chat.ts', literal: 'src/preload/[variant]/bridge.ts' },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: { index: 'src/renderer/main.ts' },
      },
    },
  },
});
