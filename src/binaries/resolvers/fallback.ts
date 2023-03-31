import parseArgs from 'minimist';
import { compact } from '../../util/array.js';
import { toBinary, tryResolveFilePaths } from '../util.js';
import type { Resolver } from '../types.js';
import type { ParsedArgs } from 'minimist';

type ArgResolver = (parsed: ParsedArgs) => string[];
type ArgResolvers = Record<string, ArgResolver>;

const withPositional: ArgResolver = parsed => [parsed._[0], parsed.require].flat();
const withoutPositional: ArgResolver = parsed => [parsed.require].flat();

const argFilters: ArgResolvers = {
  'babel-node': withPositional,
  esbuild: withPositional,
  execa: withPositional,
  nodemon: withPositional,
  'ts-node': withPositional,
  zx: withPositional,
  tsx: parsed => parsed._.filter(p => p !== 'watch'),
  default: withoutPositional,
};

export const resolve: Resolver = (binary, args, { cwd }) => {
  const parsed = parseArgs(args, { string: ['r'], alias: { require: ['r', 'loader'] }, boolean: ['quiet', 'verbose'] });
  const argFilter = argFilters[binary as keyof typeof argFilters] ?? argFilters.default;
  const filteredArgs = compact(argFilter(parsed));
  return [toBinary(binary), ...tryResolveFilePaths(cwd, filteredArgs)];
};
