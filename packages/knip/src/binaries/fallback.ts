import parseArgs from 'minimist';
import type { BinaryResolver } from '../types/config.js';
import { compact } from '../util/array.js';
import { toBinary, toDeferResolve, toEntry } from '../util/input.js';

// Binaries that spawn a child process for the binary at first positional arg (and don't have custom resolver already)
const spawningBinaries = ['cross-env', 'retry-cli'];

// Binaries that have a new script behind the double-dash/end-of-command (and don't have custom resolver already)
const endOfCommandBinaries = ['dotenvx'];

const positionals = new Set(['babel-node', 'esbuild', 'execa', 'vite-node', 'zx']);

export const resolve: BinaryResolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { boolean: ['quiet', 'verbose'], '--': endOfCommandBinaries.includes(binary) });
  const bin = binary.startsWith('.') ? toEntry(binary) : toBinary(binary);
  const shiftedArgs = spawningBinaries.includes(binary) ? fromArgs(args) : [];
  const pos = positionals.has(binary) ? [toDeferResolve(parsed._[0])] : [];
  const newCommand = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--']) : [];
  return compact([bin, ...shiftedArgs, ...pos, ...newCommand]);
};
