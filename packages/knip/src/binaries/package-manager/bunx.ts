import parseArgs from 'minimist';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
import { argsFrom } from '../util.js';

export const resolveX = (args: string[], options: BinaryResolverOptions) => {
  const { fromArgs } = options;
  const parsed = parseArgs(args);
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed['shell-mode'] ? fromArgs([parsed['shell-mode']]) : [];
  const restArgs = argsFrom(args, packageSpecifier);
  const dependency = specifier ? [toDependency(specifier, { optional: true })] : [];
  return [...dependency, ...packages.map(id => toDependency(id)), ...command, ...fromArgs(restArgs).slice(1)];
};

export const resolve: BinaryResolver = (_binary, args, options) => {
  return resolveX(args, options);
};
