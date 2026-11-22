import solid from '@solidjs/vite-plugin';

export default {
  plugins: [
    solid({
      ssr: true,
      start: {
        app: './src/root.tsx',
        document: './src/shell.tsx',
        entryServer: './src/server.tsx',
        entryClient: './src/client.tsx',
        middleware: './src/middleware.ts',
        instrument: './src/instrument.ts',
        env: false,
      },
      serverFunctions: { configure: './src/configure.ts' },
    }),
  ],
};
