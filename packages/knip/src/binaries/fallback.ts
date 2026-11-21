import type { Word } from 'unbash';
import parseArgs, { type ParsedArgs } from '../util/parse-args.ts';
import type { BinaryResolver, ScriptArg } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { toModule, toEntry } from '../util/input.ts';
import { isValidBinary } from '../util/modules.ts';
import { isAbsolute } from '../util/path.ts';
import { argsFrom, isEnvAssignment, toCommandBinary } from './util.ts';

// Generic fallbacks for basic handling of binaries that don't have a plugin nor a custom resolver

export const shellSpawningBinaries = ['cross-env-shell'];

export const spawningBinaries = ['cross-env', ...shellSpawningBinaries];

export const getEnvAssignmentCount = (values: string[]) => {
  let count = 0;
  while (count < values.length && isEnvAssignment.test(values[count])) count++;
  return count;
};

// Binaries that have a new script behind the double-dash/end-of-command
const endOfCommandBinaries = ['doppler', 'dotenvx', 'infisical', 'op'];

// Binaries that have a new script in a flag value
const commandFlagBinaries = new Map([
  ['doppler', ['command']],
  ['infisical', ['command', 'c']],
]);

// Binaries with entry at first positional arg
const positionals = new Set(['babel-node', 'execa', 'jiti', 'oxnode', 'vite-node', 'zx']);

// Binaries where each positional arg is a separate script
const positionalBinaries = new Set(['concurrently']);

export const isWrapper = (binary: string) =>
  spawningBinaries.includes(binary) || endOfCommandBinaries.includes(binary) || positionalBinaries.has(binary);

const parse = (binary: string, words: Word[]) =>
  parseArgs(words, {
    boolean: ['quiet', 'verbose'],
    string: commandFlagBinaries.get(binary) ?? [],
    '--': endOfCommandBinaries.includes(binary),
  });

const toWrappedScripts = (binary: string, words: Word[], parsed: ParsedArgs) => {
  const scripts: ScriptArg[][] = [];
  if (parsed['--'] && parsed['--'].length > 0) scripts.push(argsFrom(words, '--').slice(1));
  if (positionalBinaries.has(binary)) for (const script of parsed._) scripts.push([script]);
  for (const flag of commandFlagBinaries.get(binary) ?? []) if (parsed[flag]) scripts.push([parsed[flag]]);
  return scripts;
};

export const getWrappedScripts = (binary: string, words: Word[]): ScriptArg[][] =>
  endOfCommandBinaries.includes(binary) || commandFlagBinaries.has(binary) || positionalBinaries.has(binary)
    ? toWrappedScripts(binary, words, parse(binary, words))
    : [];

export const resolve: BinaryResolver = (binary, words, options) => {
  const { fromArgs } = options;
  const parsed = parse(binary, words);
  const bin =
    binary.startsWith('.') || (binary.includes('/') && !isAbsolute(binary))
      ? toEntry(binary)
      : isValidBinary(binary)
        ? toCommandBinary(binary, options)
        : undefined;
  const pos = positionals.has(binary) ? [toModule(parsed._[0])] : [];
  const commands = toWrappedScripts(binary, words, parsed).flatMap(script => fromArgs(script));
  return compact([bin, ...pos, ...commands]);
};
