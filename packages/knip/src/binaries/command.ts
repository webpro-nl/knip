import type { Command, Word } from 'unbash';
import { Plugins, pluginArgsMap } from '../plugins.ts';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions } from '../types/config.ts';
import { type Input, toBinary, toDeferResolve } from '../util/input.ts';
import { extractBinary } from '../util/modules.ts';
import { resolve as fallbackResolve, spawningBinaries } from './fallback.ts';
import KnownResolvers from './resolvers/index.ts';
import { resolve as resolverFromPlugins } from './plugins.ts';
import { parseNodeArgs } from './util.ts';

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
  const binary = text ? extractBinary(text) : text;
  const { fromArgs } = options;

  if (!binary || binary === '.' || binary === 'source' || binary === '[') return [];
  if (binary.startsWith('-') || binary.startsWith('..')) return [];

  const words = node.suffix;

  if (binary === '!' || binary === 'test') return fromArgs(words);

  const fromNodeOptions = getInputsFromNodeOptions(node.prefix);

  if (binary in KnownResolvers) {
    const resolver = KnownResolvers[binary as KnownResolver];
    return resolver(binary, words, options);
  }

  if (pluginArgsMap.has(binary)) {
    return [...resolverFromPlugins(binary, words, options), ...fromNodeOptions];
  }

  if (spawningBinaries.includes(binary)) {
    return [toBinary(binary), ...fromWords(words, options)];
  }

  if (binary in Plugins) {
    const inputs = fallbackResolve(binary, words, options);
    if (options.knownBinsOnly) for (const input of inputs) input.optional = true;
    return [...inputs, ...fromNodeOptions];
  }

  if (options.knownBinsOnly && !text?.startsWith('.')) return [];

  return [...fallbackResolve(binary, words, options), ...fromNodeOptions];
};
