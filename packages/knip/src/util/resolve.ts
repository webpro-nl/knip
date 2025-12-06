import { ResolverFactory } from 'oxc-resolver';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

const createSyncResolver = (extensions: string[]) => {
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

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json', '.jsonc']);

export const _resolveSync = timerify(resolveSync);

export const _createSyncResolver: typeof createSyncResolver = extensions => timerify(createSyncResolver(extensions));
