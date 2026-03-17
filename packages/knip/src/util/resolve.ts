import { ResolverFactory } from 'oxc-resolver';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS } from '../constants.ts';
import { timerify } from './Performance.ts';
import { toPosix } from './path.ts';

const extensionAlias = {
  '.js': ['.js', '.ts', '.tsx', '.d.ts'],
  '.jsx': ['.jsx', '.tsx'],
  '.mjs': ['.mjs', '.mts', '.d.mts'],
  '.cjs': ['.cjs', '.cts', '.d.cts'],
};

const resolverInstances: ResolverFactory[] = [];

const createSyncModuleResolver = (extensions: string[], alias?: Record<string, string[]>) => {
  const aliasOpt = alias && { alias };
  const baseOptions = {
    extensions,
    extensionAlias,
    conditionNames: ['require', 'import', 'node', 'default'],
    nodePath: false,
    ...aliasOpt,
  };
  const resolver = new ResolverFactory({ tsconfig: 'auto', ...baseOptions });
  const fallbackResolver = new ResolverFactory(baseOptions);

  resolverInstances.push(resolver, fallbackResolver);

  return function resolveSync(specifier: string, basePath: string) {
    const resolved = resolver.resolveFileSync(basePath, specifier);
    if (resolved.path) return toPosix(resolved.path);
    if (resolved.error) {
      const fallback = fallbackResolver.resolveFileSync(basePath, specifier);
      if (fallback.path) return toPosix(fallback.path);
    }
  };
};

const resolveModuleSync = createSyncModuleResolver([...DEFAULT_EXTENSIONS, ...DTS_EXTENSIONS, '.json', '.jsonc']);

/**
 * Default module resolver (no custom extensions or path aliases).
 */
export const _resolveModuleSync = timerify(resolveModuleSync, 'resolveModuleSync');

export const _createSyncModuleResolver = (extensions: string[], alias?: Record<string, string[]>) =>
  timerify(createSyncModuleResolver(extensions, alias), 'resolveModuleSync');

/** Convert TS compilerOptions.paths to oxc-resolver alias format */
export function convertPathsToAlias(paths: Record<string, string[]> | undefined): Record<string, string[]> | undefined {
  if (!paths) return undefined;
  const alias: Record<string, string[]> = {};
  for (const key in paths) {
    const stripWildcard = key.endsWith('/*');
    const aliasKey = stripWildcard ? key.slice(0, -2) : key;
    alias[aliasKey] = stripWildcard ? paths[key].map(v => (v.endsWith('/*') ? v.slice(0, -2) : v)) : paths[key];
  }
  return alias;
}

const createSyncResolver = (extensions: string[]) => {
  const resolver = new ResolverFactory({
    extensions,
    conditionNames: ['require', 'import', 'node', 'default'],
    nodePath: false,
  });

  resolverInstances.push(resolver);

  return function resolveSync(specifier: string, baseDir: string) {
    const resolved = resolver.sync(baseDir, specifier);
    if (resolved.path) return toPosix(resolved.path);
  };
};

export function clearResolverCache() {
  for (const resolver of resolverInstances) resolver.clearCache();
}

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']);

/**
 * Resolver for everything outside the realm of TS module resolution.
 * That's everything coming directly from package.json, scripts and plugins
 * that's an `Input` except those of type `entry` or `project`.
 */
export const _resolveSync = timerify(resolveSync);
