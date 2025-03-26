import ts from 'typescript';
import { getPropertyValues, stripQuotes } from '../../typescript/ast-helpers.js';

export const getComponentPathsFromSourceFile = (sourceFile: ts.SourceFile) => {
  const componentPaths: Set<string> = new Set();
  let starlightImportName: string | undefined;

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const importPath = stripQuotes(node.moduleSpecifier.getText());
      if (importPath === '@astrojs/starlight') starlightImportName = node.importClause?.name?.getText();
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === starlightImportName) {
      const firstArg = node.arguments[0];
      if (ts.isObjectLiteralExpression(firstArg)) {
        const values = getPropertyValues(firstArg, 'components');
        for (const value of values) componentPaths.add(value);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return componentPaths;
};
