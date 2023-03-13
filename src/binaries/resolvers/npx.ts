import parseArgs from 'minimist';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { '--': true, stopEarly: true, boolean: ['yes', 'no'], alias: { yes: 'y', no: 'n' } });
  return [...(parsed.yes ? [] : fromArgs(parsed._)), ...(parsed['--'] ? fromArgs(parsed['--']) : [])];
};
