import parseArgs from 'minimist';
import type { BinaryResolver } from '../types/config.js';
import { compact } from '../util/array.js';
import { toBinary, toDeferResolve, toEntry } from '../util/input.js';

// Generic fallbacks for basic handling of binaries that don't have a plugin nor a custom resolver

// Binaries that spawn a child process for the binary at first positional arg
const spawningBinaries = ['cross-env', 'retry-cli'];

// Binaries that have a new script behind the double-dash/end-of-command
const endOfCommandBinaries = ['dotenvx', 'env-cmd'];

// Binaries with entry at first positional arg
const positionals = new Set(['babel-node', 'esbuild', 'execa', 'jiti', 'oxnode', 'vite-node', 'zx']);

// Binaries where each positional arg is a separate script
const positionalBinaries = new Set(['concurrently']);

export const resolve: BinaryResolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args, { boolean: ['quiet', 'verbose'], '--': endOfCommandBinaries.includes(binary) });
  const bin = binary.startsWith('.') ? toEntry(binary) : /[*:]/.test(binary) ? undefined : toBinary(binary);
  const shiftedArgs = spawningBinaries.includes(binary) ? fromArgs(args) : [];
  const pos = positionals.has(binary) ? [toDeferResolve(parsed._[0])] : [];
  const newCommand = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--']) : [];
  const commands = positionalBinaries.has(binary) ? parsed._.flatMap(cmd => fromArgs([cmd])) : [];
  return compact([bin, ...shiftedArgs, ...pos, ...newCommand, ...commands]);
};
