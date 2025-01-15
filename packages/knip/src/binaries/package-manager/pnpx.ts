import parseArgs from 'minimist';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';

export const resolveDlx = (args: string[], options: BinaryResolverOptions) => {
  const parsed = parseArgs(args, {
    boolean: ['silent'],
    alias: { package: 'p', 'shell-mode': 'c' },
  });
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed['shell-mode'] ? options.fromArgs([parsed['shell-mode']]) : [];
  const dependency = specifier ? [toDependency(specifier, { optional: true })] : [];
  return [...dependency, ...packages.map(id => toDependency(id, { optional: true })), ...command];
};

export const resolve: BinaryResolver = (_binary, args, options) => {
  return resolveDlx(args, options);
};
