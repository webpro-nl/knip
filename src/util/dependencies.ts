import { ts } from 'ts-morph';
import isBuiltinModule from 'is-builtin-module';
import micromatch from 'micromatch';
import type { SourceFile } from 'ts-morph';
import type { Configuration, Issue } from '../types';

const compact = <T>(collection: (T | undefined)[]) =>
  Array.from(new Set(collection)).filter((value): value is T => Boolean(value));

export const getDependencyAnalyzer = (configuration: Configuration) => {
  const { dependencies, devDependencies, peerDependencies, optionalDependencies, tsConfigPaths } = configuration;

  const productionDependencies = [...dependencies, ...peerDependencies, ...optionalDependencies];

  const referencedDependencies: Set<string> = new Set();

  const getUnresolvedDependencies = (sourceFile: SourceFile) => {
    const unresolvedDependencies: Set<Issue> = new Set();
    // Unfortunately `sourceFile.getReferencedSourceFiles` does not seem to return `require` calls, so here we are.
    const importLiterals = sourceFile.getImportStringLiterals();
    const requires = sourceFile
      .getDescendantsOfKind(ts.SyntaxKind.CallExpression)
      .filter(callExpression => callExpression.getExpression().getText() === 'require')
      .map(expression => expression.getFirstDescendantByKind(ts.SyntaxKind.StringLiteral));
    const literals = compact([importLiterals, requires].flat());
    literals.forEach(importLiteral => {
      const moduleSpecifier = importLiteral.getLiteralText();
      if (moduleSpecifier.startsWith('.')) return;
      if (isBuiltinModule(moduleSpecifier)) return;
      if (tsConfigPaths.length > 0 && micromatch.isMatch(moduleSpecifier, tsConfigPaths)) return;
      const parts = moduleSpecifier.split('/').slice(0, 2);
      const packageName = moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
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

  return { getUnresolvedDependencies, getUnusedDependencies, getUnusedDevDependencies };
};
