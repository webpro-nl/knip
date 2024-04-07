import parseArgs from 'minimist';
import { toBinary } from '../../util/protocols.js';
import type { Resolver } from '../types.js';
import { argsFrom } from '../util.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args);
  return [toBinary(binary), ...fromArgs(argsFrom(args, parsed._[0]))];
};
