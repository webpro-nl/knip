import { defineConfig } from '@rsbuild/core';

export default defineConfig(async ({ command, env, envMode }) => {
  if (command === 'dev' && env === 'development' && envMode === 'development') {
    return { source: { entry: { playground: './src/playground.ts' } } };
  }

  if (command === 'build' && env === 'production' && envMode === 'production') {
    return {
      output: { target: 'node' },
      environments: {
        server: {
          tools: {
            rspack: (config, { target }) => {
              if (target === 'node') config.entry = './src/app.ts';
            },
          },
        },
      },
    };
  }

  return {};
});
