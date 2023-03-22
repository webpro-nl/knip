import { isInNodeModules, join } from '../../util/path.js';
import { _tryResolve } from '../../util/require.js';

export const tryResolveFilePath = (cwd: string, specifier: string, fallback?: string) => {
  if (specifier) {
    const filePath = join(cwd, specifier);
    if (!isInNodeModules(filePath)) {
      const resolvedFilePath = _tryResolve(filePath, cwd);
      if (resolvedFilePath) return [resolvedFilePath];
    }
    return fallback ? [fallback] : [];
  }
  return [];
};

export const tryResolveFilePaths = (cwd: string, specifiers: string[]) =>
  specifiers.flatMap(specifier => tryResolveFilePath(cwd, specifier, specifier));
