import { ResolverFactory } from '@rspack/resolver';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

export const createSyncResolver = (extensions: string[]) => {
  const resolver = new ResolverFactory({
    extensions,
    conditionNames: ['require', 'import', 'node', 'default'],
  });

  return function resolveSync(specifier: string, baseDir: string) {
    try {
      const result = resolver.sync(baseDir, specifier);
      if (result.path) return toPosix(result.path);
    } catch (_error) {}
  };
};

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json']);

export const _resolveSync = timerify(resolveSync);

export const _createSyncResolver: typeof createSyncResolver = extensions => timerify(createSyncResolver(extensions));
