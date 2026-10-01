import assert from 'node:assert/strict';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const workerConfig = {
  entry: './worker-entry.ts',
};

export default defineConfig({
  plugins: [pluginReact()],
  output: { target: 'node' },
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
      output: { target: 'web-worker' },
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
        rspack: async (config, { isProd, target, isWebWorker }) => {
          assert.equal(target, 'web-worker');
          assert.equal(isWebWorker, true);
          config.module.rules.push({ loader: isProd ? 'production-loader' : 'development-loader' });
          config.plugins.push({ apply() {} });
          return { ...config, ...workerConfig };
        },
      },
    },
    aliases: {
      tools: {
        rspack: (config, { target, isServer }) => {
          assert.equal(target, 'node');
          assert.equal(isServer, true);
          config.resolve.alias['@shared$'] = './entry-1.ts';
          config.module.rules.push({ loader: 'missing-loader' });
        },
      },
    },
  },
});
