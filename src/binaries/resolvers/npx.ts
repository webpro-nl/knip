import parseArgs from 'minimist';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { '--': true, stopEarly: true, boolean: ['yes', 'no'], alias: { yes: 'y', no: 'n' } });
  const left = fromArgs(parsed._);
  const right = parsed['--'] ? fromArgs(parsed['--']) : [];
  return [...(parsed.yes ? left.slice(1) : left), ...right];
};
