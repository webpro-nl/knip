import parseArgs from 'minimist';
import { tryResolveFilePath, tryResolveFilePaths } from './util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd }) => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader', 'experimental-loader'] } });
  return [...tryResolveFilePath(cwd, parsed._[0]), ...tryResolveFilePaths(cwd, [parsed.require].flat())];
};
