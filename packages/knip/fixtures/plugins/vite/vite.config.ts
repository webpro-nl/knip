import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  resolve: {
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
