import type { Word } from 'unbash';
import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { getCatalogReference } from '../../util/catalog.ts';
import { isBinary, toCatalog, toDependency } from '../../util/input.ts';
import { extractBinary, stripVersionFromSpecifier } from '../../util/modules.ts';

const toDependencyInputs = (packageSpecifier: string) => {
  const dependency = toDependency(stripVersionFromSpecifier(packageSpecifier), { optional: true });
  const reference = getCatalogReference(packageSpecifier);
  return reference ? [dependency, toCatalog(reference.packageName, reference.catalogName)] : [dependency];
};

const parseOptions = {
  isStorePositions: true,
  boolean: ['silent'],
  alias: { package: 'p', 'shell-mode': 'c', dir: 'C' },
};

export const resolveDlx = (words: Word[], options: BinaryResolverOptions) => {
  const parsed = parseArgs(words, parseOptions);
  const packageSpecifier = parsed._[0];
  const commandIndex = parsed.positionalIndices![0] ?? words.length;
  const flags = parseArgs(words.slice(0, commandIndex), parseOptions);
  const packages = flags.package && !flags.yes ? [flags.package].flat() : [];
  const command = flags['shell-mode'] ? options.fromArgs([flags['shell-mode']]) : [];
  const dependencyInputs = packageSpecifier ? toDependencyInputs(packageSpecifier) : [];
  const forwarded = packageSpecifier && !flags.dir ? options.fromArgs(words.slice(commandIndex)) : [];
  const [first] = forwarded;
  const isOuterCommand = first && isBinary(first) && first.specifier === extractBinary(packageSpecifier);
  return [
    ...dependencyInputs,
    ...packages.flatMap(toDependencyInputs),
    ...command,
    ...(isOuterCommand ? forwarded.slice(1) : forwarded),
  ];
};

export const resolve: BinaryResolver = (_binary, words, options) => {
  return resolveDlx(words, options);
};
