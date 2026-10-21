import { ResolverFactory } from 'oxc-resolver';
import { nativeResolverCache, isYarnPnp } from '../native-resolver-cache.ts';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS } from '../constants.ts';
import { timerify } from './Performance.ts';
import { toPosix } from './path.ts';

export const extensionAlias: Record<string, string[]> = {
  '.js': ['.js', '.ts', '.tsx', '.d.ts'],
  '.jsx': ['.jsx', '.tsx'],
  '.mjs': ['.mjs', '.mts', '.d.mts'],
  '.cjs': ['.cjs', '.cts', '.d.cts'],
};

const resolverInstances: ResolverFactory[] = [];

const declarationResolver = new ResolverFactory({
  extensions: [...DTS_EXTENSIONS, ...DEFAULT_EXTENSIONS],
  extensionAlias: {
    '.ts': ['.d.ts', '.ts'],
    '.mts': ['.d.mts', '.mts'],
    '.cts': ['.d.cts', '.cts'],
    '.js': ['.d.ts', '.js'],
    '.mjs': ['.d.mts', '.mjs'],
    '.cjs': ['.d.cts', '.cjs'],
  },
  conditionNames: ['types', 'import', 'require', 'node', 'default'],
  nodePath: false,
});

resolverInstances.push(declarationResolver);

export const resolvePackageManifestPath = (packageName: string, baseDir: string) =>
  nativeResolverCache.resolvePackageManifestPath(packageName, baseDir) ?? undefined;

const createSyncModuleResolver = (extensions: string[], tsConfigFile?: string) => {
  const resolver = nativeResolverCache.createFileResolver(extensions, tsConfigFile, isYarnPnp());
  return (specifier: string, basePath: string) => resolver.resolveFile(specifier, basePath) ?? undefined;
};

const resolveModuleSync = (specifier: string, basePath: string) =>
  nativeResolverCache.resolveFile(specifier, basePath) ?? undefined;

/**
 * Default module resolver (no custom extensions or path aliases).
 */
export const _resolveModuleSync = timerify(resolveModuleSync, 'resolveModuleSync');

const resolveDeclarationSync = (specifier: string, containingFile: string) => {
  const result = declarationResolver.resolveFileSync(containingFile, specifier);
  if (!result.path) return;
  return {
    path: toPosix(result.path),
    packageJsonPath: result.packageJsonPath ? toPosix(result.packageJsonPath) : undefined,
  };
};

export const _resolveDeclarationSync = timerify(resolveDeclarationSync, 'resolveDeclarationSync');

export const _createSyncModuleResolver = (extensions: string[], tsConfigFile?: string) =>
  timerify(createSyncModuleResolver(extensions, tsConfigFile), 'resolveModuleSync');

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

export function clearResolverCache(recording?: boolean) {
  nativeResolverCache.clear(recording);
  for (const resolver of resolverInstances) resolver.clearCache();
}

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']);

/**
 * Resolver for everything outside the realm of TS module resolution.
 * That's everything coming directly from package.json, scripts and plugins
 * that's an `Input` except those of type `entry` or `project`.
 */
export const _resolveSync = timerify(resolveSync);
