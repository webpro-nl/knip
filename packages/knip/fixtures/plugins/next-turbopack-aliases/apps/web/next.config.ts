import type { NextConfig } from 'next';

const unrelated = { resolveAlias: { unused: './adapters/unrelated.ts' } };
const isExtensionBuild = process.env.EXTENSION_BUILD === 'true';

export default {
  turbopack: isExtensionBuild
    ? {
        resolveAlias: {
          '@fixtures/telemetry/client': '@fixtures/telemetry/no-external',
          relative: './adapters/relative.ts',
          browser: { browser: './adapters/browser.ts' },
          array: ['./adapters/array.ts'],
          conditionalArray: { browser: ['./adapters/conditional-array.ts'] },
          dependency: 'alias-dependency',
        },
      }
    : process.env.WEB_BUILD &&
      ({
        resolveAlias: {
          fallback: './adapters/fallback.ts',
        },
      } satisfies NextConfig['turbopack']),
} satisfies NextConfig;
