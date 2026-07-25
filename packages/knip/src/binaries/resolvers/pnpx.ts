import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { getCatalogReference } from '../../util/catalog.ts';
import { toCatalog, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';

const toDependencyInputs = (packageSpecifier: string) => {
  const dependency = toDependency(stripVersionFromSpecifier(packageSpecifier), { optional: true });
  const reference = getCatalogReference(packageSpecifier);
  return reference ? [dependency, toCatalog(reference.packageName, reference.catalogName)] : [dependency];
};

export const resolveDlx = (args: string[], options: BinaryResolverOptions) => {
  const parsed = parseArgs(args, {
    boolean: ['silent'],
    alias: { package: 'p', 'shell-mode': 'c' },
  });
  const packageSpecifier = parsed._[0];
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat() : [];
  const command = parsed['shell-mode'] ? options.fromArgs([parsed['shell-mode']]) : [];
  const dependencyInputs = packageSpecifier ? toDependencyInputs(packageSpecifier) : [];
  return [...dependencyInputs, ...packages.flatMap(toDependencyInputs), ...command];
};

export const resolve: BinaryResolver = (_binary, args, options) => {
  return resolveDlx(args, options);
};
