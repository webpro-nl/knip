import path from 'node:path';
import parseArgs from 'minimist';
import { tryResolve } from '../../require.js';

export const resolve = (binary: string, args: string[], cwd: string): string[] => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader', 'experimental-loader'] } });
  const resolve = [parsed._[0], parsed.require].flat();
  return resolve.flatMap(specifier => {
    if (specifier) {
      const filePath = path.join(cwd, specifier);
      if (filePath.startsWith(cwd)) {
        const resolvedFilePath = tryResolve(filePath);
        if (resolvedFilePath) return [resolvedFilePath];
      }
      return [specifier];
    }
    return [];
  });
};
