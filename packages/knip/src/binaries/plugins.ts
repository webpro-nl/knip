import { parse as parseScript, type Word } from 'unbash';
import parseArgs from '../util/parse-args.ts';
import { pluginArgsMap } from '../plugins.ts';
import type { Args } from '../types/args.ts';
import type { BinaryResolver, GetScriptCommands, ScriptArg, ScriptCommand } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { type Input, toBinary, toConfig, toModule, toEntryPath, toEntry } from '../util/input.ts';
import { extractBinary, isInNodeModulesBin } from '../util/modules.ts';
import { dirname } from '../util/path.ts';
import { collectCommands, getCommandWords } from '../util/scripts.ts';
import {
  isWrapper as isFallbackWrapper,
  resolve as fallbackResolve,
  shellSpawningBinaries,
  spawningBinaries,
} from './fallback.ts';
import { isGlobLike, nodeLoadersArgs, spawningArgs, toCommandBinary, toWordArgs } from './util.ts';

const isEnvAssignment = /^\w+=/;

export const isWrapper = (binary: string) => !!pluginArgsMap.get(binary)?.[1].fromArgs || isFallbackWrapper(binary);

const spawningPluginArgs: Args = { fromArgs: spawningArgs };

const toShellAssignment = (assignment: string) => {
  const index = assignment.indexOf('=');
  return `${assignment.slice(0, index)}='${assignment.slice(index + 1).replaceAll("'", "'\\''")}'`;
};

const shellSpawningPluginArgs: Args = {
  fromArgs: (_, args) => {
    const command: string[] = [];
    let isAssignment = true;
    for (const arg of args) {
      isAssignment &&= isEnvAssignment.test(arg);
      command.push(isAssignment ? toShellAssignment(arg) : arg);
    }
    return command.join(' ');
  },
};

const toArgValues = (pluginArgs: Args, values: string[]) =>
  typeof pluginArgs.args === 'function' ? pluginArgs.args(values) : values;

const toArgs = (pluginArgs: Args, words: Word[]) =>
  toArgValues(
    pluginArgs,
    words.map(word => word.value)
  );

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
    boolean: pluginArgs.boolean === true ? true : ['quiet', 'verbose', 'watch', ...(pluginArgs.boolean ?? [])],
    alias: {
      ...(pluginArgs.nodeImportArgs ? nodeLoadersArgs : {}),
      ...(pluginArgs.config === true ? { config: ['c'] } : {}),
      ...pluginArgs.alias,
    },
    '--': true,
    stopEarly: pluginArgs.stopEarly,
  });
};

const valueOf = (arg: ScriptArg) => (typeof arg === 'string' ? arg : arg.value);

export const toForwardedScript = (args: ScriptArg[]): string => {
  const parts: string[] = [];
  for (const arg of args) {
    if (parts.length === 0 && valueOf(arg) === '--') continue;
    parts.push(typeof arg === 'string' ? arg : arg.text);
  }
  return parts.join(' ');
};

const toCommandArgs = (command: string[] | string, words: Word[]): ScriptArg[] =>
  typeof command === 'string' ? (command ? [command] : []) : toWordArgs(command, words);

export const getWrappedCommand = (binary: string, words: Word[], cwd = process.cwd()): ScriptArg[] | undefined => {
  const pluginArgs =
    pluginArgsMap.get(binary)?.[1] ??
    (shellSpawningBinaries.includes(binary)
      ? shellSpawningPluginArgs
      : spawningBinaries.includes(binary)
        ? spawningPluginArgs
        : undefined);
  const fromArgs = pluginArgs?.fromArgs;
  if (!pluginArgs || typeof fromArgs !== 'function') return;
  const args = toArgs(pluginArgs, words);
  return toCommandArgs(fromArgs(parse(pluginArgs, args), args, { cwd }), words);
};

export const getScriptCommands: GetScriptCommands = (script, cwd = process.cwd()) => {
  if (!script) return [];
  const out: ScriptCommand[] = [];
  try {
    for (const statement of parseScript(script).commands) {
      for (const node of collectCommands(statement.command)) {
        const text = node.name?.value;
        if (!text) continue;
        const binary = extractBinary(text);
        const words = getCommandWords(node);
        const command = getWrappedCommand(binary, words, cwd);
        if (command?.length) out.push(...getScriptCommands(toForwardedScript(command), cwd));
        else out.push({ binary, args: words.map(word => word.value) });
      }
    }
  } catch {
    return [];
  }
  return out;
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
  const operand = parsed._[0] ?? parsed['--']?.[0];
  const ids =
    typeof pluginArgs.positional === 'function'
      ? pluginArgs.positional(parsed)
      : pluginArgs.positional && operand
        ? [operand]
        : [];
  for (const id of ids) {
    if (isGlobLike(id)) positionals.push(toEntry(id));
    else if (isInNodeModulesBin(id)) positionals.push(toBinary(extractBinary(id)));
    else positionals.push(toEntryPath(id, { optional: true }));
  }

  const mapToParsedKey = (id: string) => parsed[id];
  const resolved = compact(pluginArgs.resolve ? pluginArgs.resolve.flatMap(mapToParsedKey) : []);

  const resolvedImports = pluginArgs.nodeImportArgs && parsed.import ? [parsed.import].flat() : [];

  const resolvedFromArgs =
    typeof pluginArgs.fromArgs === 'function'
      ? fromArgs(toCommandArgs(pluginArgs.fromArgs(parsed, args, { cwd }), words))
      : Array.isArray(pluginArgs.fromArgs)
        ? fromArgs(pluginArgs.fromArgs.flatMap(mapToParsedKey).filter(Boolean))
        : [];

  const config = pluginArgs.config === true ? ['config'] : pluginArgs.config || [];
  const mapToConfigPattern = (value: string | [string, (value: string) => string]) => {
    if (!pluginName) return [];
    if (typeof value === 'string')
      return compact([parsed[value]].flat()).map(arg => toConfig(pluginName, arg, inputOpts));
    const [id, fn] = value;
    return compact([parsed[id]].flat()).map(arg => toConfig(pluginName, fn(arg), inputOpts));
  };
  const configFilePaths = config.flatMap(mapToConfigPattern);

  const inputs: Input[] = pluginArgs.resolveInputs?.(parsed, { args, cwd, manifest }) ?? [];

  return [
    toCommandBinary(binary, options, inputOpts),
    ...positionals,
    ...resolved.map(id => toModule(id)),
    ...resolvedImports.map(id => toModule(id)),
    ...resolvedFromArgs,
    ...configFilePaths,
    ...inputs,
  ];
};
