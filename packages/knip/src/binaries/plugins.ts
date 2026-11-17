import { forEachChild, parse as parseScript, type SyntaxNode, type Word } from 'unbash';
import parseArgs from '../util/parse-args.ts';
import { pluginArgsMap } from '../plugins.ts';
import type { Args } from '../types/args.ts';
import type { BinaryResolver, GetScriptCommands, ScriptArg, ScriptCommand } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { type Input, toBinary, toConfig, toModule, toEntryPath, toEntry } from '../util/input.ts';
import { extractBinary, isInNodeModulesBin } from '../util/modules.ts';
import { dirname } from '../util/path.ts';
import { collectCommands, getCommandWords, isScriptExpansion } from '../util/scripts.ts';
import {
  isWrapper as isFallbackWrapper,
  resolve as fallbackResolve,
  shellSpawningBinaries,
  spawningBinaries,
} from './fallback.ts';
import KnownResolvers from './resolvers/index.ts';
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
    boolean: ['quiet', 'verbose', 'watch', ...(pluginArgs.boolean ?? [])],
    alias: {
      ...(pluginArgs.nodeImportArgs ? nodeLoadersArgs : {}),
      ...(pluginArgs.config === true ? { config: ['c'] } : {}),
      ...pluginArgs.alias,
    },
    '--': true,
  });
};

const valueOf = (arg: ScriptArg) => (typeof arg === 'string' ? arg : arg.value);

// Whether a forwarded `--` stays in the child's script: a wrapper decides about its own separators when its command
// is forwarded in turn, and a command with a plugin keeps the one after its operands, where the rest belongs to the
// script. Anything else is dropped, as forwarding always did, so options and operands of the child still parse.
const isCommandWrapper = (binary: string) =>
  isFallbackWrapper(binary) || typeof pluginArgsMap.get(binary)?.[1].fromArgs === 'function';

const toKeptSeparators = (script: string, offsets: Set<number>) => {
  const kept = new Set<number>();
  const visit = (node: SyntaxNode) => {
    if (node.type === 'Command' && node.name) {
      const binary = extractBinary(node.name.value);
      const pluginArgs = binary in KnownResolvers ? undefined : pluginArgsMap.get(binary)?.[1];
      const values: string[] = [];
      for (const word of getCommandWords(node)) {
        const isForwarded = word.value === '--' && offsets.has(word.pos);
        const isKept =
          isForwarded &&
          (isCommandWrapper(binary) ||
            (!!pluginArgs && parse(pluginArgs, toArgValues(pluginArgs, values))._.length > 0));
        if (isKept) kept.add(word.pos);
        if (!isForwarded || isKept) values.push(word.value);
      }
    }
    // A script with its own decoded source (escaped backticks) has positions that don't index this text
    if (!isScriptExpansion(node)) forEachChild(node, visit);
    else if (node.script && node.script.source === undefined) visit(node.script);
  };
  visit(parseScript(script));
  return kept;
};

export const toForwardedScript = (args: ScriptArg[]): string => {
  const parts: string[] = [];
  const separators: number[] = [];
  for (const arg of args) {
    const value = valueOf(arg);
    if (value === '--' && parts.length === 0) continue;
    if (value === '--') separators.push(parts.length);
    parts.push(typeof arg === 'string' ? arg : arg.text);
  }
  const script = parts.join(' ');
  if (separators.length === 0) return script;
  const starts: number[] = [];
  let offset = 0;
  for (const part of parts) {
    starts.push(offset);
    offset += part.length + 1;
  }
  let kept = new Set<number>();
  try {
    kept = toKeptSeparators(script, new Set(separators.map(index => starts[index])));
  } catch {}
  const dropped = new Set(separators.filter(index => !kept.has(starts[index])));
  return parts.filter((_, index) => !dropped.has(index)).join(' ');
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
  if (pluginArgs.positional && parsed._[0]) {
    const id = parsed._[0]; // let's start out safe, but sometimes we'll want more
    if (isGlobLike(id)) positionals.push(toEntry(id));
    else {
      if (isInNodeModulesBin(id)) positionals.push(toBinary(extractBinary(id)));
      else positionals.push(toEntryPath(id, { optional: true }));
    }
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
