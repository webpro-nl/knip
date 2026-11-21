import type { Word } from 'unbash';
import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { getCatalogReference } from '../../util/catalog.ts';
import { toCatalog, toDependency } from '../../util/input.ts';
import { extractBinary, stripVersionFromSpecifier } from '../../util/modules.ts';
import { removeOuterCommand } from '../util.ts';

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
  const executable = packageSpecifier ? extractBinary(String(packageSpecifier)) : '';
  const forwarded = executable && !flags.dir ? options.fromArgs([executable, ...words.slice(commandIndex + 1)]) : [];
  removeOuterCommand(forwarded, executable);
  return [...dependencyInputs, ...packages.flatMap(toDependencyInputs), ...command, ...forwarded];
};

export const resolve: BinaryResolver = (_binary, words, options) => {
  return resolveDlx(words, options);
};
