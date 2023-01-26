import parseArgs from 'minimist';
import { tryResolveFilePath } from './node.js';
import type { Resolver } from '../types.js';
import type { ParsedArgs } from 'minimist';

type ArgResolvers = Record<string, (parsed: ParsedArgs) => string[]>;

const argResolvers: ArgResolvers = {
  'ts-node': parsed => [parsed._[0], parsed.require].flat(),
  tsx: parsed => parsed._.filter(p => p !== 'watch'),
  default: parsed => [parsed.require].flat(),
};

export const resolve: Resolver = (binary, args, { cwd }) => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader'] } });
  const resolver = argResolvers[binary as keyof typeof argResolvers] ?? argResolvers.default;
  const resolve = resolver(parsed);
  return [binary, ...resolve.flatMap(specifier => tryResolveFilePath(cwd, specifier))];
};
