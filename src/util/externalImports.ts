import { ts } from 'ts-morph';
import { findCallExpressionsByName } from 'ts-morph-helpers';
import { compact } from './array.js';
import { timerify } from './performance.js';
import type { SourceFile } from 'ts-morph';

const findRequireModuleSpecifiers = (sourceFile: SourceFile) =>
  [findCallExpressionsByName(sourceFile, 'require'), findCallExpressionsByName(sourceFile, 'require.resolve')]
    .flat()
    .flatMap(expression => {
      const list = expression.getFirstChildByKind(ts.SyntaxKind.SyntaxList);
      return (
        list?.getFirstChildByKind(ts.SyntaxKind.StringLiteral) ??
        list?.getFirstChildByKind(ts.SyntaxKind.NoSubstitutionTemplateLiteral) ??
        list?.getFirstChildByKind(ts.SyntaxKind.TemplateExpression)
      );
    });

const findExternalImportModuleSpecifiers = (sourceFile: SourceFile) => {
  const importLiterals = sourceFile.getImportStringLiterals();
  const requireCallExpressions = findRequireModuleSpecifiers(sourceFile);
  return compact(
    [...importLiterals, ...requireCallExpressions].map(importLiteral => {
      if (!importLiteral) return;
      if (importLiteral.isKind(ts.SyntaxKind.TemplateExpression)) return importLiteral.getFullText().slice(1, -1);
      return importLiteral?.getLiteralText();
    })
  ).filter(moduleSpecifier => !moduleSpecifier.startsWith('.'));
};

export const _findExternalImportModuleSpecifiers = timerify(findExternalImportModuleSpecifiers);
