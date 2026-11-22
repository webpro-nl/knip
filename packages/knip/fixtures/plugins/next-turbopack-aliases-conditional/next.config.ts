import type { NextConfig } from 'next';

const unrelated = {
  resolveAlias: { unused: './unused.ts' },
};

export default {
  turbopack: process.env.EXTENSION_BUILD
    ? {
        resolveAlias: {
          telemetry: './no-external.ts',
        },
      }
    : {
        resolveAlias: {
          telemetry: { browser: './browser.ts' },
          pino: 'pino/browser',
        },
      },
} satisfies NextConfig;
