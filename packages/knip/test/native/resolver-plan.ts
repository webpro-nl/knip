import { builtinModules, isBuiltin } from 'node:module';
import type { NativeResolverPlan } from '../../src/native-module-resolver.ts';

type PackageTarget = NativeResolverPlan['workspaces'][number]['imports'];

export function encodePackageTarget(value: unknown): PackageTarget {
  const result: PackageTarget = { kind: 0, keys: [], children: [] };
  if (typeof value === 'string') {
    result.kind = 1;
    result.text = value;
  } else if (Array.isArray(value)) {
    result.kind = 2;
    for (const item of value) result.children.push(encodePackageTarget(item));
  } else if (value && typeof value === 'object') {
    result.kind = 3;
    for (const [key, child] of Object.entries(value)) {
      result.keys.push(key);
      result.children.push(encodePackageTarget(child));
    }
  }
  return result;
}

export const resolverPlan = (overrides: Partial<NativeResolverPlan> = {}): NativeResolverPlan => ({
  customCompilerExtensions: [],
  scopedPaths: [],
  scopedRootDirs: [],
  availableWorkspaceDirs: [],
  workspaces: [],
  workspaceByPackageName: [],
  builtinSpecifiers: [
    ...builtinModules,
    ...builtinModules.map(name => `node:${name}`),
    'bun:wrap',
    'bun:main',
    'node:test',
    'node:test/reporters',
    'node:sea',
    'node:quic',
    'node:node:test',
    'node:node:quic',
  ].filter(isBuiltin),
  yarnPnp: !!process.versions.pnp || process.env.OXC_RESOLVER_YARN_PNP !== undefined,
  ...overrides,
});
