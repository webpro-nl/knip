import parseArgs from 'minimist';
import { fromBinary } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { '--': true, stopEarly: true, boolean: ['yes', 'no'], alias: { yes: 'y', no: 'n' } });
  const leftParsed = fromArgs(parsed._);
  const left = parsed.yes ? leftParsed.slice(1) : leftParsed;
  const packageName = left[0] ? [fromBinary(left[0])] : [];
  const right = parsed['--'] ? fromArgs(parsed['--']) : [];
  return [...packageName, ...left.slice(1), ...right];
};
