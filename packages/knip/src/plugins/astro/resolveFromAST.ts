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
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== ASTRO_CONFIG_SPECIFIER) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const el of bindings.elements) {
      if ((el.propertyName?.text ?? el.name.text) === 'sharpImageService') return true;
    }
  }
  return false;
};
