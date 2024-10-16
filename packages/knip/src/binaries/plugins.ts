import parseArgs from 'minimist';
import { pluginArgsMap } from '../plugins.js';
import type { Resolver } from '../types/config.js';
import { compact } from '../util/array.js';
import { toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toEntry } from '../util/dependencies.js';
import { resolve as fallbackResolve } from './fallback.js';

const isGlobLikeMatch = /(^!|[*+\\(|{^$])/;
const isGlobLike = (value: string) => isGlobLikeMatch.test(value);

const nodeLoadersArgs = { import: ['r', 'experimental-loader', 'require', 'loader', 'test-reporter'] };

export const resolve: Resolver = (binary, _args, options) => {
  const { fromArgs } = options;
  const [pluginName, pluginArgs] = pluginArgsMap.get(binary) ?? [];

  if (!pluginArgs) return fallbackResolve(binary, _args, options);

  const opts = pluginArgs;

  const args = typeof opts.args === 'function' ? opts.args(_args) : _args;

  const parsed = parseArgs(args, {
    string: [
      ...(opts.nodeImportArgs ? ['import'] : []),
      ...(opts.config === true ? ['config'] : []),
      ...(opts.string ?? []),
    ],
    boolean: ['quiet', 'verbose', 'watch', ...(opts.boolean ?? [])],
    alias: {
      ...(opts.nodeImportArgs ? nodeLoadersArgs : {}),
      ...(opts.config === true ? { config: ['c'] } : {}),
      ...opts.alias,
    },
  });

  const positionals = [];
  if (opts.positional) {
    const id = parsed._[0]; // let's start out safe, but sometimes we'll want more
    if (isGlobLike(id)) positionals.push(toEntry(id));
    else positionals.push(toDeferResolveEntry(id));
  }

  const mapToParsedKey = (id: string) => parsed[id];
  const resolved = compact(opts.resolve ? opts.resolve.flatMap(mapToParsedKey) : []);

  const resolvedImports = opts.nodeImportArgs && parsed.import ? [parsed.import].flat() : [];

  const resolvedFromArgs =
    typeof opts.fromArgs === 'function'
      ? fromArgs(opts.fromArgs(parsed, args))
      : Array.isArray(opts.fromArgs)
        ? fromArgs(opts.fromArgs.flatMap(mapToParsedKey))
        : [];

  const config = opts.config === true ? ['config'] : opts.config || [];
  const mapToConfigPattern = (id: string) => (parsed[id] && pluginName ? [toConfig(pluginName, parsed[id])] : []);
  const configFilePaths = config.flatMap(mapToConfigPattern);

  return [
    toBinary(binary),
    ...positionals,
    ...resolved.map(toDeferResolve),
    ...resolvedImports.map(toDeferResolve),
    ...resolvedFromArgs,
    ...configFilePaths,
  ];
};
