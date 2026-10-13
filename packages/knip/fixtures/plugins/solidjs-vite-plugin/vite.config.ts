import solid from '@solidjs/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
      start: {
        app: process.env.CUSTOM_APP ? './src/root.tsx' : undefined,
        document: './src/shell.tsx',
        setup: './src/setup.ts',
        env: process.env.CI ? './config/env.ci.ts' : false,
      },
      serverFunctions: {
        configure: './src/server/configure.ts',
      },
    }),
  ],
});
