import resolve from 'resolve';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { dirname, toPosix } from './path.js';

export const resolveSync = (specifier: string, containingFile: string, extensions = DEFAULT_EXTENSIONS) => {
  try {
    const resolved = resolve.sync(specifier, {
      basedir: dirname(containingFile),
      extensions,
      preserveSymlinks: false,
    });
    return toPosix(resolved);
  } catch (err) {}
};
