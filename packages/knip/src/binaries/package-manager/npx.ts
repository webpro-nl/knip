import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary, toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
import { isInternal } from '../../util/path.js';
import { argsFrom } from '../util.js';

export const resolve: BinaryResolver = (_binary, args, options) => {
  const { fromArgs } = options;
  const parsed = parseArgs(args, {
    boolean: ['yes', 'no', 'quiet'],
    alias: { yes: 'y', no: 'no-install', package: 'p', call: 'c' },
  });

  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';

  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed.call ? fromArgs([parsed.call]) : [];
  const restArgs = argsFrom(args, packageSpecifier);

  const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
  const dependency = isBinary ? toBinary(specifier) : toDependency(specifier, { optional: !parsed.no });
  const specifiers = dependency && !parsed.yes ? [dependency] : [];

  return [
    ...specifiers,
    ...packages.map(id => toDependency(id, { optional: true })),
    ...command,
    ...fromArgs(restArgs).slice(1),
  ];
};
