import type { Command, Word } from 'unbash';
import { Plugins, pluginArgsMap } from '../plugins.ts';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions } from '../types/config.ts';
import { type Input, toDeferResolve } from '../util/input.ts';
import { extractBinary, isInNodeModulesBin, isRelativeNodeModulesBin } from '../util/modules.ts';
import { resolve as fallbackResolve, spawningBinaries } from './fallback.ts';
import KnownResolvers, { isPackageManager } from './resolvers/index.ts';
import { resolve as resolverFromPlugins } from './plugins.ts';
import { parseNodeArgs, toCommandBinary } from './util.ts';

type KnownResolver = keyof typeof KnownResolvers;

export const getInputsFromNodeOptions = (prefix: Command['prefix']): Input[] =>
  prefix
    .filter(a => a.name === 'NODE_OPTIONS' && a.value)
    .map(a => a.value!.value)
    .map(arg => parseNodeArgs(arg.split(' ')))
    .filter(args => args.require)
    .flatMap(arg => arg.require)
    .map(id => toDeferResolve(id));

export const getDependenciesFromCommand = (
  node: Command,
  options: BinaryResolverOptions,
  fromWords: (words: Word[], options: GetInputsFromScriptsOptions) => Input[] = options.fromArgs
): Input[] => {
  const text = node.name?.value;
  if (!text) return [];
  const binary = extractBinary(text);

  if (!binary || binary === '.' || binary === 'source' || binary === '[') return [];
  if (binary.startsWith('-') || binary.startsWith('..')) return [];

  const isExplicitBin = isInNodeModulesBin(text) || text.startsWith('.bin/');
  if (options.optionalBinaries && (isExplicitBin || isPackageManager(binary))) {
    const { fromArgs } = options;
    options = {
      ...options,
      optionalBinaries: !isExplicitBin,
      fromArgs: (args, opts) => fromArgs(args, { optionalBinaries: false, ...opts }),
    };
  }

  const { fromArgs } = options;

  const words = node.suffix;

  if (binary === '!' || binary === 'test') return fromArgs(words);

  const fromNodeOptions = getInputsFromNodeOptions(node.prefix);

  if (binary in KnownResolvers) {
    const resolver = KnownResolvers[binary as KnownResolver];
    return [...resolver(binary, words, options), ...fromNodeOptions];
  }

  if (pluginArgsMap.has(binary)) {
    return [...resolverFromPlugins(binary, words, options), ...fromNodeOptions];
  }

  if (spawningBinaries.includes(binary)) {
    return [toCommandBinary(binary, options), ...fromWords(words, options), ...fromNodeOptions];
  }

  if (binary in Plugins) {
    const inputs = fallbackResolve(binary, words, options);
    if (options.isForwardedArgs) for (const input of inputs) input.optional = true;
    return [...inputs, ...fromNodeOptions];
  }

  if (options.isForwardedArgs && !text.startsWith('.') && !isRelativeNodeModulesBin(text)) return [];

  return [...fallbackResolve(binary, words, options), ...fromNodeOptions];
};
