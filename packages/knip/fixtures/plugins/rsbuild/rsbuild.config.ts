import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const workerConfig = {
  entry: './worker-entry.ts',
};

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      entry1: 'entry-1.ts',
      entry2: ['entry-2.ts'],
      entry3: { import: 'entry-3.ts' },
      entry4: { import: ['entry-4.ts'] },
    },
    preEntry: 'pre-entry-1.ts',
  },
  tools: {
    rspack: {
      entry: './app-entry.ts',
      module: { rules: [{ loader: 'raw-loader' }, { loader: 'builtin:swc-loader' }] },
    },
  },
  environments: {
    test: {
      source: {
        entry: {
          entry5: 'entry-5.ts',
          entry6: ['entry-6.ts'],
          entry7: { import: 'entry-7.ts' },
          entry8: { import: ['entry-8.ts'] },
        },
        preEntry: ['pre-entry-2.ts', 'pre-entry-3.ts'],
      },
      tools: {
        rspack: async (config, { isProd }) => ({
          ...config,
          ...workerConfig,
          module: { rules: [{ loader: isProd ? 'production-loader' : 'development-loader' }] },
        }),
      },
    },
    aliases: {
      tools: {
        rspack: config => {
          config.resolve.alias['@shared$'] = './entry-1.ts';
        },
      },
    },
  },
});
