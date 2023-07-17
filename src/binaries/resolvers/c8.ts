import parseArgs from 'minimist';
import { toBinary } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, {
    boolean: ['all', 'check-coverage', 'clean', 'exclude-after-remap', 'per-file', 'skip-full'],
  });
  parsed._ = parsed._.filter(a => a !== 'check-coverage');
  return [toBinary(binary), ...fromArgs(parsed._)];
};
