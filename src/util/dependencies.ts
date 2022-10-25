import { ts } from 'ts-morph';
import isBuiltinModule from 'is-builtin-module';
import micromatch from 'micromatch';
import { findCallExpressionsByName } from 'ts-morph-helpers';
import type { SourceFile } from 'ts-morph';
import { timerify } from './performance.js';
import type { Configuration, Issue } from '../types.js';

const compact = <T>(collection: (T | undefined)[]) =>
  Array.from(new Set(collection)).filter((value): value is T => Boolean(value));

const findRequireModuleSpecifiers = (sourceFile: SourceFile) =>
  findCallExpressionsByName(sourceFile, 'require').map(expression =>
    expression.getFirstDescendantByKind(ts.SyntaxKind.StringLiteral)
  );

const isExternalDependency = (moduleSpecifier: string, tsConfigPathGlobs: string[]) => {
  if (moduleSpecifier.startsWith('.')) return false;
  if (isBuiltinModule(moduleSpecifier)) return false;
  if (tsConfigPathGlobs.length > 0 && micromatch.isMatch(moduleSpecifier, tsConfigPathGlobs)) return false;
  return true;
};

const resolvePackageName = (moduleSpecifier: string) => {
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

export const getDependencyAnalyzer = (configuration: Configuration) => {
  const { dependencies, devDependencies, peerDependencies, optionalDependencies, tsConfigPathGlobs } = configuration;

  const productionDependencies = [...dependencies, ...peerDependencies, ...optionalDependencies];

  const referencedDependencies: Set<string> = new Set();

  const findUnresolvedDependencies = (sourceFile: SourceFile) => {
    const unresolvedDependencies: Set<Issue> = new Set();

    // Unfortunately `sourceFile.getReferencedSourceFiles` does not seem to return `require` calls, so here we are.
    const importLiterals = sourceFile.getImportStringLiterals();
    const requireCallExpressions = findRequireModuleSpecifiers(sourceFile);
    const moduleSpecifiers = compact([importLiterals, requireCallExpressions].flat()).map(i => i.getLiteralText());

    moduleSpecifiers.forEach(moduleSpecifier => {
      if (!isExternalDependency(moduleSpecifier, tsConfigPathGlobs)) return;

      const packageName = resolvePackageName(moduleSpecifier);

      if (!productionDependencies.includes(packageName) && !devDependencies.includes(packageName)) {
        unresolvedDependencies.add({ filePath: sourceFile.getFilePath(), symbol: moduleSpecifier });
      }
      if (productionDependencies.includes(packageName) || devDependencies.includes(packageName)) {
        referencedDependencies.add(packageName);
      }
    });

    return unresolvedDependencies;
  };

  const getUnusedDependencies = () =>
    productionDependencies.filter(dependency => !referencedDependencies.has(dependency));

  const getUnusedDevDependencies = () => devDependencies.filter(dependency => !referencedDependencies.has(dependency));

  return {
    _findUnresolvedDependencies: timerify(findUnresolvedDependencies),
    getUnusedDependencies,
    getUnusedDevDependencies,
  };
};
