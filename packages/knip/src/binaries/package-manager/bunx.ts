import parseArgs from 'minimist';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { toBinary, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';
import { isInternal } from '../../util/path.ts';
import { argsFrom } from '../util.ts';

export const resolveX = (args: string[], options: BinaryResolverOptions) => {
  const { fromArgs } = options;
  const parsed = parseArgs(args, { boolean: ['bun'] });
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed['shell-mode'] ? fromArgs([parsed['shell-mode']]) : [];
  const restArgs = argsFrom(args, packageSpecifier);
  const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
  const dependency = isBinary ? toBinary(specifier, { optional: true }) : toDependency(specifier, { optional: true });
  const specifiers = specifier ? [dependency] : [];
  return [...specifiers, ...packages.map(id => toDependency(id)), ...command, ...fromArgs(restArgs).slice(1)];
};

export const resolve: BinaryResolver = (_binary, args, options) => {
  return resolveX(args, options);
};
