import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';

export const resolve: BinaryResolver = (_binary, args, options) => {
  const { fromArgs } = options;
  const parsed = parseArgs(args);
  const [command] = parsed._;
  return command !== 'exec' ? [] : fromArgs(parsed._.slice(1));
};
