import solid from '@solidjs/vite-plugin';

export default {
  plugins: [
    solid({
      ssr: true,
      start: {
        entryServer: './src/server.tsx',
        entryClient: './src/client.tsx',
        env: './config/env.ts',
      },
    }),
  ],
};
