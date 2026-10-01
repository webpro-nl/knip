import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';
import { isInternal } from '../../util/path.ts';
import { argsFrom } from '../util.ts';

const noInstallFlags = new Set(['--no', '--no-install', '--yes=false', '--no-yes']);

export const resolve: BinaryResolver = (_binary, words, options) => {
  const { fromArgs } = options;
  const parsed = parseArgs(words, {
    isStorePositions: true,
    boolean: ['yes', 'no', 'quiet'],
    alias: { yes: 'y', package: 'p', call: 'c' },
  });

  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';

  const packages = parsed.package ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed.call ? fromArgs([parsed.call]) : [];

  const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
  const commandIndex = parsed.positionalIndices![0] ?? words.length;
  const noInstall = words.slice(0, commandIndex).some(word => noInstallFlags.has(word.value));
  const opts = noInstall ? undefined : { optional: true };
  const dependency = isBinary ? toBinary(specifier, opts) : toDependency(specifier, opts);
  const specifiers = dependency ? [dependency] : [];

  return [
    ...specifiers,
    ...packages.map(id => toDependency(id, { optional: true })),
    ...command,
    ...fromArgs(argsFrom(words, packageSpecifier)).slice(1),
  ];
};
