const loadPluginModules = async () => {
  const solidModule = await import('@solidjs/vite-plugin');
  return { solid: solidModule.default };
};

export default async ({ mode }: { mode: string }) => {
  const modules = await loadPluginModules();
  return {
    plugins: [
      modules.solid({
        start: {
          entryClient: './src/client.tsx',
          middleware: mode === 'e2e' ? './src/middleware/e2e.ts' : './src/middleware/index.ts',
          setup: './src/setup.ts',
          env: mode === 'e2e' ? './config/env.ts' : true,
        },
      }),
    ],
  };
};
