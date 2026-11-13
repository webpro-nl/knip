import parseArgs from '../util/parse-args.ts';
import type { BinaryResolver } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { toModule, toEntry } from '../util/input.ts';
import { isValidBinary } from '../util/modules.ts';
import { isAbsolute } from '../util/path.ts';
import { argsAfter, toCommandBinary } from './util.ts';

// Generic fallbacks for basic handling of binaries that don't have a plugin nor a custom resolver

export const spawningBinaries = ['cross-env'];

// Binaries that have a new script behind the double-dash/end-of-command
const endOfCommandBinaries = ['doppler', 'dotenvx', 'env-cmd', 'infisical', 'op'];

// Binaries that have a new script in a flag value
const commandFlagBinaries = new Map([
  ['doppler', ['command']],
  ['infisical', ['command', 'c']],
]);

// Binaries with entry at first positional arg
const positionals = new Set(['babel-node', 'esbuild', 'execa', 'jiti', 'oxnode', 'vite-node', 'zx']);

// Binaries where each positional arg is a separate script
const positionalBinaries = new Set(['concurrently']);

export const isWrapper = (binary: string) =>
  spawningBinaries.includes(binary) || endOfCommandBinaries.includes(binary) || positionalBinaries.has(binary);

export const resolve: BinaryResolver = (binary, words, options) => {
  const { fromArgs } = options;
  const commandFlags = commandFlagBinaries.get(binary) ?? [];
  const parsed = parseArgs(words, {
    boolean: ['quiet', 'verbose'],
    string: commandFlags,
    '--': endOfCommandBinaries.includes(binary),
  });
  const bin =
    binary.startsWith('.') || (binary.includes('/') && !isAbsolute(binary))
      ? toEntry(binary)
      : isValidBinary(binary)
        ? toCommandBinary(binary, options)
        : undefined;
  const pos = positionals.has(binary) ? [toModule(parsed._[0])] : [];
  const newCommand = parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--')) : [];
  const commands = positionalBinaries.has(binary) ? parsed._.flatMap(cmd => fromArgs([cmd])) : [];
  const flagCommands = commandFlags.flatMap(flag => (parsed[flag] ? fromArgs([parsed[flag]]) : []));
  return compact([bin, ...pos, ...newCommand, ...commands, ...flagCommands]);
};
