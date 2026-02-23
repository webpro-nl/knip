import ts from 'typescript';
import { getPropertyValues } from '../../typescript/ast-helpers.ts';

const ASTRO_CONFIG_SPECIFIER = 'astro/config';

export const getSrcDir = (sourceFile: ts.SourceFile): string => {
  const srcDir = 'src';

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const values = getPropertyValues(node, 'srcDir');
      if (values.size > 0) {
        return Array.from(values)[0];
      }
    }

    let result: string | undefined;
    ts.forEachChild(node, innerNode => {
      const innerValue = visit(innerNode);
      if (innerValue) {
        result = innerValue;
        return true; // Break the iteration
      }
      return false;
    });

    return result;
  }

  return visit(sourceFile) ?? srcDir;
};

export const usesSharpImageService = (sourceFile: ts.SourceFile) => {
  const sharpImageServiceNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      if (statement.moduleSpecifier.text !== ASTRO_CONFIG_SPECIFIER) continue;
      const importClause = statement.importClause;
      if (!importClause) continue;

      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          if (
            element.propertyName?.text === 'sharpImageService' ||
            (!element.propertyName && element.name.text === 'sharpImageService')
          ) {
            sharpImageServiceNames.add(element.name.text);
          }
        }
      }
    }
  }

  function visit(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && sharpImageServiceNames.has(node.expression.text)) return true;
    }

    return ts.forEachChild(node, visit) ?? false;
  }

  return visit(sourceFile);
};
