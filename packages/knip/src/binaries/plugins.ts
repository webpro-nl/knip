import type { Word } from 'unbash';
import parseArgs from '../util/parse-args.ts';
import { pluginArgsMap } from '../plugins.ts';
import type { Args } from '../types/args.ts';
import type { BinaryResolver, ScriptArg } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { type Input, toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toEntry } from '../util/input.ts';
import { extractBinary, isInNodeModulesBin } from '../util/modules.ts';
import { dirname } from '../util/path.ts';
import { isWrapper as isFallbackWrapper, resolve as fallbackResolve, spawningBinaries } from './fallback.ts';
import { spawningArgs, toCommandBinary, toWordArgs } from './util.ts';

const isGlobLikeMatch = /(^!|[*+\\(|{^$])/;
const isGlobLike = (value: string) => isGlobLikeMatch.test(value);

const nodeLoadersArgs = { import: ['r', 'experimental-loader', 'require', 'loader'] };

export const isWrapper = (binary: string) => !!pluginArgsMap.get(binary)?.[1].fromArgs || isFallbackWrapper(binary);

const spawningPluginArgs: Args = { fromArgs: spawningArgs };

const toArgs = (pluginArgs: Args, words: Word[]) => {
  const values: string[] = [];
  for (const word of words) values.push(word.value);
  return typeof pluginArgs.args === 'function' ? pluginArgs.args(values) : values;
};

const parse = (pluginArgs: Args, args: string[]) => {
  const config = pluginArgs.config === true ? ['config'] : pluginArgs.config || [];
  const string = [
    ...(pluginArgs.nodeImportArgs ? ['import'] : []),
    ...(pluginArgs.resolve ?? []),
    ...(pluginArgs.string ?? []),
  ];
  for (const value of config) string.push(typeof value === 'string' ? value : value[0]);
  if (Array.isArray(pluginArgs.fromArgs)) string.push(...pluginArgs.fromArgs);

  return parseArgs(args, {
    string,
    boolean: ['quiet', 'verbose', 'watch', ...(pluginArgs.boolean ?? [])],
    alias: {
      ...(pluginArgs.nodeImportArgs ? nodeLoadersArgs : {}),
      ...(pluginArgs.config === true ? { config: ['c'] } : {}),
      ...pluginArgs.alias,
    },
    '--': true,
  });
};

export const getWrappedCommand = (binary: string, words: Word[], cwd = process.cwd()): ScriptArg[] | undefined => {
  const pluginArgs =
    pluginArgsMap.get(binary)?.[1] ?? (spawningBinaries.includes(binary) ? spawningPluginArgs : undefined);
  const fromArgs = pluginArgs?.fromArgs;
  if (!pluginArgs || typeof fromArgs !== 'function') return;
  const args = toArgs(pluginArgs, words);
  return toWordArgs(fromArgs(parse(pluginArgs, args), args, { cwd }), words);
};

export const resolve: BinaryResolver = (binary, words, options) => {
  const { cwd, fromArgs, containingFilePath, manifest } = options;
  const [pluginName, pluginArgs] = pluginArgsMap.get(binary) ?? [];

  if (!pluginArgs) return fallbackResolve(binary, words, options);

  const inputOpts = {};
  if (cwd && dirname(containingFilePath) !== cwd) Object.assign(inputOpts, { dir: cwd });

  const args = toArgs(pluginArgs, words);
  const parsed = parse(pluginArgs, args);

  const positionals = [];
  if (pluginArgs.positional && parsed._[0]) {
    const id = parsed._[0]; // let's start out safe, but sometimes we'll want more
    if (isGlobLike(id)) positionals.push(toEntry(id));
    else {
      if (isInNodeModulesBin(id)) positionals.push(toBinary(extractBinary(id)));
      else positionals.push(toDeferResolveEntry(id, { optional: true }));
    }
  }

  const mapToParsedKey = (id: string) => parsed[id];
  const resolved = compact(pluginArgs.resolve ? pluginArgs.resolve.flatMap(mapToParsedKey) : []);

  const resolvedImports = pluginArgs.nodeImportArgs && parsed.import ? [parsed.import].flat() : [];

  const resolvedFromArgs =
    typeof pluginArgs.fromArgs === 'function'
      ? fromArgs(toWordArgs(pluginArgs.fromArgs(parsed, args, { cwd }), words))
      : Array.isArray(pluginArgs.fromArgs)
        ? fromArgs(pluginArgs.fromArgs.flatMap(mapToParsedKey).filter(Boolean))
        : [];

  const config = pluginArgs.config === true ? ['config'] : pluginArgs.config || [];
  const mapToConfigPattern = (value: string | [string, (value: string) => string]) => {
    if (typeof value === 'string')
      return parsed[value] && pluginName ? [toConfig(pluginName, parsed[value], inputOpts)] : [];
    const [id, fn] = value;
    return parsed[id] && pluginName ? [toConfig(pluginName, fn(parsed[id]), inputOpts)] : [];
  };
  const configFilePaths = config.flatMap(mapToConfigPattern);

  const inputs: Input[] = pluginArgs.resolveInputs?.(parsed, { args, cwd, manifest }) ?? [];

  return [
    toCommandBinary(binary, options, inputOpts),
    ...positionals,
    ...resolved.map(id => toDeferResolve(id)),
    ...resolvedImports.map(id => toDeferResolve(id)),
    ...resolvedFromArgs,
    ...configFilePaths,
    ...inputs,
  ];
};
