import path from 'node:path';
import { ts } from 'ts-morph';
import { findCallExpressionsByName } from 'ts-morph-helpers';
import { require } from '../util/require.js';
import { compact } from './array.js';
import { timerify } from './performance.js';
import type { SourceFile } from 'ts-morph';

const getImportStringLiterals = (sourceFile: SourceFile) =>
  sourceFile
    .getImportDeclarations()
    .filter(declaration => !declaration.isTypeOnly())
    .flatMap(declaration => declaration.getDescendantsOfKind(ts.SyntaxKind.StringLiteral));

const findCommonJSModuleSpecifiers = (sourceFile: SourceFile) =>
  [
    ...findCallExpressionsByName(sourceFile, 'require'),
    ...findCallExpressionsByName(sourceFile, 'require.resolve'),
  ].flatMap(expression => {
    const list = expression.getFirstChildByKind(ts.SyntaxKind.SyntaxList);
    return (
      list?.getFirstChildByKind(ts.SyntaxKind.StringLiteral) ??
      list?.getFirstChildByKind(ts.SyntaxKind.NoSubstitutionTemplateLiteral) ??
      list?.getFirstChildByKind(ts.SyntaxKind.TemplateExpression)
    );
  });

const resolveInternal = (filePath: string, moduleSpecifiers: string[]) =>
  moduleSpecifiers
    .filter(moduleSpecifier => moduleSpecifier.startsWith('.'))
    .map(moduleSpecifier => {
      try {
        return require.resolve(path.join(path.dirname(filePath), moduleSpecifier));
      } catch (e) {
        // Ignore dynamic-dynamic imports and other "unresolvables"
      }
    });

const findImportModuleSpecifiers = (
  sourceFile: SourceFile,
  options = { skipInternal: false, isStrict: false }
): [string[], string[]] => {
  const filePath = sourceFile.getFilePath();
  const importLiterals = options.isStrict ? getImportStringLiterals(sourceFile) : sourceFile.getImportStringLiterals();
  const requireCallExpressions = findCommonJSModuleSpecifiers(sourceFile);
  const moduleSpecifiers = compact(
    [...importLiterals, ...requireCallExpressions].map(importLiteral => {
      if (!importLiteral) return;
      if (importLiteral.isKind(ts.SyntaxKind.TemplateExpression)) {
        const literalText = importLiteral.getFullText();
        if (literalText.includes('${')) return; // Substitutions in template literals are not supported
        return literalText.slice(1, -1);
      }
      return importLiteral?.getLiteralText();
    })
  );
  const internalModuleSpecifiers = options.skipInternal ? [] : resolveInternal(filePath, moduleSpecifiers);
  const externalModuleSpecifiers = moduleSpecifiers.filter(moduleSpecifier => !moduleSpecifier.startsWith('.'));
  return [compact(internalModuleSpecifiers), externalModuleSpecifiers];
};

export const _findImportModuleSpecifiers = timerify(findImportModuleSpecifiers);
