import type { Word } from 'unbash';
import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { toBinary, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';
import { isInternal } from '../../util/path.ts';
import { argsFrom } from '../util.ts';

export const resolveX = (words: Word[], options: BinaryResolverOptions) => {
  const { fromArgs } = options;
  const parsed = parseArgs(words, { boolean: ['bun'] });
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed['shell-mode'] ? fromArgs([parsed['shell-mode']]) : [];
  const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
  const dependency = isBinary ? toBinary(specifier, { optional: true }) : toDependency(specifier, { optional: true });
  const specifiers = specifier ? [dependency] : [];
  return [
    ...specifiers,
    ...packages.map(id => toDependency(id)),
    ...command,
    ...fromArgs(argsFrom(words, packageSpecifier)).slice(1),
  ];
};

export const resolve: BinaryResolver = (_binary, words, options) => {
  return resolveX(words, options);
};
