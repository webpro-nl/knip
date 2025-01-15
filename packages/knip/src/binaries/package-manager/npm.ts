import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary } from '../../util/input.js';

export const resolve: BinaryResolver = (binary, args, options) => {
  const { fromArgs } = options;
  const parsed = parseArgs(args);
  const [command] = parsed._;
  return [toBinary(binary), ...(command !== 'exec' ? [] : fromArgs(parsed._.slice(1)))];
};
