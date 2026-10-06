import { defineConfig } from '@rsbuild/core';

export default defineConfig(async ({ command, env, envMode }) => {
  if (envMode !== env) throw new Error(`Unexpected Rsbuild env mode: ${envMode}`);

  if (command === 'dev' && env === 'development') {
    return { source: { entry: { playground: './src/playground.ts' } } };
  }

  if (command === 'build' && env === 'production') {
    return {
      output: { target: 'node' },
      environments: {
        server: {
          tools: {
            rspack: (config, { target }) => {
              if (target !== 'node') throw new Error(`Unexpected Rspack target: ${target}`);
              config.entry = './src/app.ts';
            },
          },
        },
      },
    };
  }

  throw new Error(`Unexpected Rsbuild command: ${command}`);
});
