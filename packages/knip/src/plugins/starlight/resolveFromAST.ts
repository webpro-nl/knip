import ts from 'typescript';
import { getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.js';

export const getComponentPathsFromSourceFile = (sourceFile: ts.SourceFile) => {
  const componentPaths: Set<string> = new Set();
  const importMap = getImportMap(sourceFile);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === starlightImportName) {
      const starlightConfig = node.arguments[0];
      if (ts.isObjectLiteralExpression(starlightConfig)) {
        const values = getPropertyValues(starlightConfig, 'components');
        for (const value of values) componentPaths.add(value);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return componentPaths;
};
