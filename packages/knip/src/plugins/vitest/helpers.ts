import type { ViteConfig } from './types.js';

/**
 * Sources:
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/env/index.ts
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/reporters/index.ts
 */

type BuiltinEnvironment = 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime';

const environments = {
  node: null,
  jsdom: null,
  'happy-dom': null,
  'edge-runtime': null,
};

const envPackageNames: Record<Exclude<keyof typeof environments, 'node'>, string> = {
  jsdom: 'jsdom',
  'happy-dom': 'happy-dom',
  'edge-runtime': '@edge-runtime/vm',
};

export const getEnvPackageName = (env: string) => {
  if (env in envPackageNames) return envPackageNames[env as Exclude<BuiltinEnvironment, 'node'>];
  return `vitest-environment-${env}`;
};

const builtInReporters = ['default', 'verbose', 'dot', 'json', 'tap', 'tap-flat', 'junit', 'hanging-process'];

export const getExternalReporters = (reporters?: ViteConfig['test']['reporters']) =>
  reporters
    ? [reporters]
        .flat()
        .filter((reporter): reporter is string => typeof reporter === 'string' && !builtInReporters.includes(reporter))
    : [];
