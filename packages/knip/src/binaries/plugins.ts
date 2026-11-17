import { type Command, forEachChild, parse as parseScript, type SyntaxNode, type Word } from 'unbash';
import parseArgs from '../util/parse-args.ts';
import { pluginArgsMap } from '../plugins.ts';
import type { Args } from '../types/args.ts';
import type { BinaryResolver, GetScriptCommands, ScriptArg, ScriptCommand } from '../types/config.ts';
import { compact } from '../util/array.ts';
import { type Input, toBinary, toConfig, toModule, toEntryPath, toEntry } from '../util/input.ts';
import { extractBinary, isInNodeModulesBin } from '../util/modules.ts';
import { dirname } from '../util/path.ts';
import { collectCommands, getCommandWords, isScriptExpansion } from '../util/scripts.ts';
import { isWrapper as isFallbackWrapper, resolve as fallbackResolve, spawningBinaries } from './fallback.ts';
import { isGlobLike, nodeLoadersArgs, spawningArgs, toCommandBinary, toScript, toWordArgs } from './util.ts';

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

const valueOf = (arg: ScriptArg) => (typeof arg === 'string' ? arg : arg.value);

// A forwarded child keeps its `--` after its operands, where the rest belongs to the script. Before them it only ends
// the child's options, so it's dropped as before and the child's plugin still finds its operands in `parsed._`
// Escaped backticks give a script its own decoded source, which is the raw text without some backslashes
const toRawIndex = (raw: string, decoded: string, index: number) => {
  let r = 0;
  for (let d = 0; d < index; r++) if (raw[r] === decoded[d]) d++;
  while (r < raw.length && raw[r] !== decoded[index]) r++;
  return r;
};

const dropLeadingSeparators = (script: string): string | undefined => {
  const separators: number[] = [];
  const visit = (node: SyntaxNode, source: string, toText: (pos: number) => number) => {
    const pluginArgs = node.type === 'Command' && node.name && pluginArgsMap.get(extractBinary(node.name.value))?.[1];
    if (pluginArgs) {
      const words = getCommandWords(node as Command);
      const separator = words.findIndex(word => word.value === '--');
      if (separator !== -1 && parse(pluginArgs, toArgs(pluginArgs, words.slice(0, separator)))._.length === 0)
        separators.push(toText(words[separator].pos));
    }
    if (!isScriptExpansion(node)) forEachChild(node, child => visit(child, source, toText));
    else if (node.script?.source === undefined) {
      if (node.script) visit(node.script, source, toText);
    } else {
      const decoded = node.script.source;
      const raw = source.slice(node.pos + 1, node.end - 1);
      visit(node.script, decoded, pos => toText(node.pos + 1 + toRawIndex(raw, decoded, pos)));
    }
  };
  visit(parseScript(script), script, pos => pos);
  const valid = separators.filter(pos => script.slice(pos, pos + 2) === '--');
  if (valid.length === 0) return;
  let out = script;
  for (const pos of valid.sort((a, b) => b - a)) out = out.slice(0, pos) + out.slice(pos + 2).replace(/^ +/, '');
  return out;
};

export const toForwardedScript = (args: ScriptArg[]): string => {
  let script = toScript(args);
  if (!args.some((arg, index) => index > 0 && valueOf(arg) === '--')) return script;
  try {
    for (let next = dropLeadingSeparators(script); next !== undefined; next = dropLeadingSeparators(script))
      script = next;
  } catch {}
  return script;
};

export const getWrappedCommand = (binary: string, words: Word[], cwd = process.cwd()): ScriptArg[] | undefined => {
  const pluginArgs =
    pluginArgsMap.get(binary)?.[1] ?? (spawningBinaries.includes(binary) ? spawningPluginArgs : undefined);
  const fromArgs = pluginArgs?.fromArgs;
  if (!pluginArgs || typeof fromArgs !== 'function') return;
  const args = toArgs(pluginArgs, words);
  return toWordArgs(fromArgs(parse(pluginArgs, args), args, { cwd }), words);
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
      ? fromArgs(toWordArgs(pluginArgs.fromArgs(parsed, args, { cwd }), words))
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
