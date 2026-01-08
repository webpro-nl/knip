import ts from 'typescript';
import { getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.js';
import { type Input, toProductionEntry } from '../../util/input.js';

export const getInputsFromSourceFile = (sourceFile: ts.SourceFile): Input[] => {
  const inputs: Input[] = [];

  const componentPaths: Set<string> = new Set();
  const importMap = getImportMap(sourceFile);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === starlightImportName) {
      const starlightConfig = node.arguments[0];
      if (ts.isObjectLiteralExpression(starlightConfig)) {
        const componentsValues = getPropertyValues(starlightConfig, 'components');
        for (const value of componentsValues) componentPaths.add(value);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  for (const path of componentPaths) {
    inputs.push(toProductionEntry(path));
  }

  return inputs;
};
