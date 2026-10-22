import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: { input: isSsrBuild ? './server/app.ts' : undefined },
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^~icons\//, replacement: 'unplugin-icons/' },
    ],
    dedupe: ['shared-state'],
  },
  optimizeDeps: {
    include: ['linked-package', 'many-components/**/*.vue', 'upstream-esm > nested-commonjs'],
  },
  ssr: {
    external: ['native-renderer', 'transitive-runtime', /^@grpc\//],
  },
  plugins: [
    react({
      babel: {
        plugins: ['@emotion/babel-plugin'],
        presets: ['@babel/preset-typescript'],
      },
    }),
  ],
}));
