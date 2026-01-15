import { ResolverFactory } from 'oxc-resolver';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

const createSyncModuleResolver = (extensions: string[]) => {
  const resolver = new ResolverFactory({
    tsconfig: 'auto',
    extensions,
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.jsx': ['.jsx', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    },
    conditionNames: ['require', 'import', 'node', 'default'],
  });

  return function resolveSync(specifier: string, basePath: string) {
    try {
      const resolved = resolver.resolveFileSync(basePath, specifier);
      if (resolved?.path) return toPosix(resolved.path);
    } catch (_error) {}
  };
};

const resolveModuleSync = createSyncModuleResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']);

/**
 * Resolver for the TS program during module resolution (i.e. used in
 * languageServiceHost.resolveModuleNames + compilerHost.resolveModuleNames).
 * Serves as fast resolver, with fallback to `ts.resolveModuleName`.
 */
export const _resolveModuleSync = timerify(resolveModuleSync, 'resolveModuleSync');

export const _createSyncModuleResolver: typeof createSyncModuleResolver = extensions =>
  timerify(createSyncModuleResolver(extensions), 'resolveModuleSync');

const createSyncResolver = (extensions: string[]) => {
  const resolver = new ResolverFactory({
    extensions,
    conditionNames: ['require', 'import', 'node', 'default'],
  });

  return function resolveSync(specifier: string, baseDir: string) {
    try {
      const resolved = resolver.sync(baseDir, specifier);
      if (resolved?.path) return toPosix(resolved.path);
    } catch (_error) {}
  };
};

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.d.ts', '.d.mts', '.d.cts', '.json', '.jsonc']);

/**
 * Resolver for everything outside the realm of TS module resolution.
 * That's everything coming directly from package.json, scripts and plugins
 * that's an `Input` except those of type `entry` or `project`.
 */
export const _resolveSync = timerify(resolveSync);
