import parseArgs from 'minimist';
import type { Resolver } from '../../types/config.js';
import { toBinary, toDependency } from '../../util/dependencies.js';
import { isInternal } from '../../util/path.js';
import { argsFrom, stripVersionFromSpecifier } from '../util.js';

export const resolve: Resolver = (_binary, args, options) => {
  const { fromArgs, dependencies } = options;
  const parsed = parseArgs(args, {
    boolean: ['yes', 'no', 'quiet'],
    alias: { yes: 'y', no: 'no-install', package: 'p', call: 'c' },
  });

  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';

  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed.call ? fromArgs([parsed.call]) : [];
  const restArgs = argsFrom(args, packageSpecifier);

  const isBinary =
    specifier && !packageSpecifier.includes('@') && !isInternal(specifier) && !dependencies.has(specifier);
  const dependency = isBinary ? toBinary(specifier) : toDependency(specifier);
  const specifiers = dependency && !parsed.yes ? [dependency] : [];

  return [toBinary(_binary), ...specifiers, ...packages.map(toDependency), ...command, ...fromArgs(restArgs).slice(1)];
};
