import resolve from 'resolve';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

const resolveSync = (specifier: string, baseDir: string, extensions = DEFAULT_EXTENSIONS) => {
  try {
    const resolved = resolve.sync(specifier, {
      basedir: baseDir,
      extensions,
      preserveSymlinks: false,
    });
    return toPosix(resolved);
  } catch (_error) {}
};

export const _resolveSync = timerify(resolveSync);
