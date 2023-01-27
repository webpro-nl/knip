import path from 'node:path';
import parseArgs from 'minimist';
import { tryResolve } from '../../require.js';
import type { Resolver } from '../types.js';

const tryResolveFilePath = (cwd: string, specifier: string, fallback?: string) => {
  if (specifier) {
    const filePath = path.join(cwd, specifier);
    if (filePath.startsWith(cwd)) {
      const resolvedFilePath = tryResolve(filePath);
      if (resolvedFilePath) return [resolvedFilePath];
    }
    return fallback ? [fallback] : [];
  }
  return [];
};

export const tryResolveFilePaths = (cwd: string, specifiers: string[]) =>
  specifiers.flatMap(specifier => tryResolveFilePath(cwd, specifier, specifier));

export const resolve: Resolver = (binary, args, { cwd }) => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader', 'experimental-loader'] } });
  return [...tryResolveFilePath(cwd, parsed._[0]), ...tryResolveFilePaths(cwd, [parsed.require].flat())];
};
