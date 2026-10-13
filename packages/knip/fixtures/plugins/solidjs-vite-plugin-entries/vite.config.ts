import { defineConfig } from 'vite';

const loadPluginModules = async () => {
  const solidModule = await import('@solidjs/vite-plugin');
  return { solid: solidModule.default };
};

export default defineConfig(async ({ mode }) => {
  const modules = await loadPluginModules();
  return {
    plugins: [
      modules.solid({
        ssr: true,
        start: {
          entryServer: './src/server.tsx',
          entryClient: './src/client.tsx',
          middleware: mode === 'e2e' ? './src/middleware/e2e.ts' : './src/middleware/index.ts',
          instrument: './src/instrument.ts',
          env: mode === 'e2e' ? './config/env.ts' : true,
        },
      }),
    ],
  };
});
