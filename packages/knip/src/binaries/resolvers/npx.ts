import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';
import { isInternal } from '../../util/path.ts';
import { argsFrom } from '../util.ts';

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
  const opts = parsed.no ? undefined : { optional: true };
  const dependency = isBinary ? toBinary(specifier, opts) : toDependency(specifier, opts);
  const specifiers = dependency && !parsed.yes ? [dependency] : [];

  return [
    ...specifiers,
    ...packages.map(id => toDependency(id, { optional: true })),
    ...command,
    ...fromArgs(restArgs).slice(1),
  ];
};
