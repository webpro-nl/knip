import { ResolverFactory } from 'oxc-resolver';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { timerify } from './Performance.ts';
import { toPosix } from './path.ts';

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
    nodePath: false,
  });

  return function resolveSync(specifier: string, basePath: string) {
    try {
      const resolved = resolver.resolveFileSync(basePath, specifier);
      if (resolved?.path) return toPosix(resolved.path);
    } catch (_error) {}
  };
};

/**
 * Default module resolver (no custom extensions or path aliases).
 */
export const resolveModuleSync = createSyncModuleResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']);

export { createSyncModuleResolver };

const createSyncResolver = (extensions: string[]) => {
  const resolver = new ResolverFactory({
    extensions,
    conditionNames: ['require', 'import', 'node', 'default'],
    nodePath: false,
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
