import parseArgs from 'minimist';
import { pluginArgsMap } from '../plugins.js';
import type { BinaryResolver } from '../types/config.js';
import { compact } from '../util/array.js';
import { toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toEntry } from '../util/input.js';
import { extractBinary } from '../util/modules.js';
import { dirname } from '../util/path.js';
import { resolve as fallbackResolve } from './fallback.js';

const isGlobLikeMatch = /(^!|[*+\\(|{^$])/;
const isGlobLike = (value: string) => isGlobLikeMatch.test(value);

const nodeLoadersArgs = { import: ['r', 'experimental-loader', 'require', 'loader'] };

export const resolve: BinaryResolver = (binary, _args, options) => {
  const { fromArgs, containingFilePath } = options;
  const [pluginName, pluginArgs] = pluginArgsMap.get(binary) ?? [];

  if (!pluginArgs) return fallbackResolve(binary, _args, options);

  const inputOpts = {};
  if (options.cwd && dirname(containingFilePath) !== options.cwd) Object.assign(inputOpts, { dir: options.cwd });

  const args = typeof pluginArgs.args === 'function' ? pluginArgs.args(_args) : _args;

  const parsed = parseArgs(args, {
    string: [
      ...(pluginArgs.nodeImportArgs ? ['import'] : []),
      ...(pluginArgs.config === true ? ['config'] : []),
      ...(pluginArgs.string ?? []),
    ],
    boolean: ['quiet', 'verbose', 'watch', ...(pluginArgs.boolean ?? [])],
    alias: {
      ...(pluginArgs.nodeImportArgs ? nodeLoadersArgs : {}),
      ...(pluginArgs.config === true ? { config: ['c'] } : {}),
      ...pluginArgs.alias,
    },
  });

  const positionals = [];
  if (pluginArgs.positional && parsed._[0]) {
    const id = parsed._[0]; // let's start out safe, but sometimes we'll want more
    if (isGlobLike(id)) positionals.push(toEntry(id));
    else {
      if (id.includes('node_modules/.bin/')) positionals.push(toBinary(extractBinary(id)));
      else positionals.push(toDeferResolveEntry(id));
    }
  }

  const mapToParsedKey = (id: string) => parsed[id];
  const resolved = compact(pluginArgs.resolve ? pluginArgs.resolve.flatMap(mapToParsedKey) : []);

  const resolvedImports = pluginArgs.nodeImportArgs && parsed.import ? [parsed.import].flat() : [];

  const resolvedFromArgs =
    typeof pluginArgs.fromArgs === 'function'
      ? fromArgs(pluginArgs.fromArgs(parsed, args))
      : Array.isArray(pluginArgs.fromArgs)
        ? fromArgs(pluginArgs.fromArgs.flatMap(mapToParsedKey))
        : [];

  const config = pluginArgs.config === true ? ['config'] : pluginArgs.config || [];
  const mapToConfigPattern = (value: string | [string, (value: string) => string]) => {
    if (typeof value === 'string')
      return parsed[value] && pluginName ? [toConfig(pluginName, parsed[value], inputOpts)] : [];
    const [id, fn] = value;
    return parsed[id] && pluginName ? [toConfig(pluginName, fn(parsed[id]), inputOpts)] : [];
  };
  const configFilePaths = config.flatMap(mapToConfigPattern);

  return [
    toBinary(binary, inputOpts),
    ...positionals,
    ...resolved.map(toDeferResolve),
    ...resolvedImports.map(toDeferResolve),
    ...resolvedFromArgs,
    ...configFilePaths,
  ];
};
