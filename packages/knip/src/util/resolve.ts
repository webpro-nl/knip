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

const defaultConditionNames = ['require', 'import', 'node', 'default'];
const browserConditionNames = ['require', 'import', 'browser', 'default'];

export const createResolver = (conditions?: string[]) => {
  const resolverInstances: ResolverFactory[] = [];
  const getConditionNames = (conditionNames: string[]) => conditions ?? conditionNames;

  const createSyncModuleResolver = (extensions: string[], tsConfigFile?: string) => {
    const baseOptions = {
      extensions,
      extensionAlias,
      conditionNames: getConditionNames(defaultConditionNames),
      nodePath: false,
    };
    const resolver = new ResolverFactory({
      tsconfig: tsConfigFile ? { configFile: tsConfigFile, references: 'auto' } : 'auto',
      ...baseOptions,
    });
    const fallbackResolver = new ResolverFactory({
      ...baseOptions,
      conditionNames: getConditionNames(browserConditionNames),
    });

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

  const resolveModuleSync = timerify(
    createSyncModuleResolver([...DEFAULT_EXTENSIONS, ...DTS_EXTENSIONS, '.json', '.jsonc']),
    'resolveModuleSync'
  );

  const createModuleResolver = (extensions: string[], tsConfigFile?: string) =>
    timerify(createSyncModuleResolver(extensions, tsConfigFile), 'resolveModuleSync');

  const createSyncResolver = (extensions: string[]) => {
    const resolver = new ResolverFactory({
      extensions,
      conditionNames: getConditionNames(defaultConditionNames),
      nodePath: false,
    });

    resolverInstances.push(resolver);

    return function resolveSync(specifier: string, baseDir: string) {
      const resolved = resolver.sync(baseDir, specifier);
      if (resolved.path) return toPosix(resolved.path);
    };
  };

  const resolveSync = timerify(createSyncResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']));
  const clearCache = () => {
    for (const resolver of resolverInstances) resolver.clearCache();
  };

  return { resolveModuleSync, createModuleResolver, resolveSync, clearCache };
};

export type Resolver = ReturnType<typeof createResolver>;
