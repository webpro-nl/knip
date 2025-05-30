import { ResolverFactory } from 'oxc-resolver';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

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

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json']);

export const _resolveSync = timerify(resolveSync);

export const _createSyncResolver: typeof createSyncResolver = extensions => timerify(createSyncResolver(extensions));
