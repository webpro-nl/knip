import parseArgs from 'minimist';
import type { Resolver } from '../types/config.js';
import { compact } from '../util/array.js';
import { toBinary, toDeferResolve, toEntry } from '../util/protocols.js';

// Binaries that spawn a child process for the binary at first positional arg (and don't have custom resolver already)
const spawningBinaries = ['cross-env', 'retry-cli'];

const positionals = new Set(['babel-node', 'esbuild', 'execa', 'vite-node', 'zx']);

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { boolean: ['quiet', 'verbose'] });
  const bin = binary.startsWith('.') ? toEntry(binary) : toBinary(binary);
  const shiftedArgs = spawningBinaries.includes(binary) ? fromArgs(args) : [];
  const pos = positionals.has(binary) ? [toDeferResolve(parsed._[0])] : [];
  return compact([bin, ...shiftedArgs, ...pos]);
};
