import { type Input, toAlias } from '../../util/input.ts';
import { join, toPosix } from '../../util/path.ts';
import type { AliasOptions, ViteConfig } from './types.ts';

/**
 * Sources:
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/env/index.ts
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/reporters/index.ts
 */

type KnownEnvironment = 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime';

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

export const getEnvSpecifier = (env: string) => {
  if (env in envPackageNames) return envPackageNames[env as Exclude<KnownEnvironment, 'node'>];
  return `vitest-environment-${env}`;
};

// See full list here:
// https://github.com/vitest-dev/vitest/blob/v3.2.4/packages/vitest/src/node/reporters/index.ts#L46-L58
// https://github.com/vitest-dev/vitest/blob/v4.0.3/packages/vitest/src/node/reporters/index.ts#L47-L59
const builtInReporters = [
  'basic',
  'blob',
  'default',
  'dot',
  'github-actions',
  'hanging-process',
  'html',
  'json',
  'junit',
  'tap',
  'tap-flat',
  'tree',
  'verbose',
];

const addStar = (value: string) => (value.endsWith('*') ? value : join(value, '*').replace(/\/\*\*$/, '/*'));

export const getAliasInputs = (aliasOptions: AliasOptions, cwd: string): Input[] => {
  const inputs: Input[] = [];
  for (const [alias, value] of Object.entries(aliasOptions)) {
    if (!value) continue;
    const prefixes = [value]
      .flat()
      .filter((value): value is string => typeof value === 'string')
      .map(prefix => (toPosix(prefix).startsWith(cwd) ? prefix : join(cwd, prefix)));
    if (alias.length > 1) inputs.push(toAlias(alias, prefixes));
    inputs.push(toAlias(addStar(alias), prefixes.map(addStar)));
  }
  return inputs;
};

export const getExternalReporters = (reporters?: ViteConfig['test']['reporters']) =>
  reporters
    ? [reporters]
        .flat()
        .map(reporter => (Array.isArray(reporter) ? reporter[0] : reporter))
        .filter((reporter): reporter is string => typeof reporter === 'string' && !builtInReporters.includes(reporter))
    : [];
