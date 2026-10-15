import type { NextConfig } from 'next';

const unrelated = {
  loader: 'unused-loader',
  loaders: ['unused-loader'],
  resolveAlias: { unused: './unused.ts' },
};

export default {
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.ts',
      telemetry: { browser: './browser.ts' },
      adapters: ['./adapter.ts'],
      pino: 'pino/browser',
    },
    rules: {
      '*.css': { loaders: ['@tailwindcss/webpack'], as: '*.css' },
      '*.svg': { loaders: [{ loader: '@svgr/webpack', options: { icon: true } }], as: '*.js' },
      '*.md': [
        { condition: 'browser', loaders: ['raw-loader'], as: '*.js' },
        { condition: { not: 'browser' }, loaders: [{ loader: './loaders/server.cjs' }], as: '*.js' },
      ],
      '*.csv': ['csv-loader', { loader: 'string-replace-loader', options: { search: 'fruit', replace: 'apple' } }],
    },
  },
} satisfies NextConfig;
