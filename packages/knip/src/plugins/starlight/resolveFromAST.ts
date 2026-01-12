import ts from 'typescript';
import { getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.js';
import { type Input, toEntry, toProductionEntry } from '../../util/input.js';

export const getInputsFromSourceFile = (sourceFile: ts.SourceFile): Input[] => {
  const inputs: Input[] = [];

  const componentPaths: Set<string> = new Set();
  const importMap = getImportMap(sourceFile);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');

  // Starlight enables Expressive Code by default
  // // https://starlight.astro.build/reference/configuration/#expressivecode
  let isExpressiveCodeEnabled = true;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === starlightImportName) {
      const starlightConfig = node.arguments[0];
      if (ts.isObjectLiteralExpression(starlightConfig)) {
        const componentsValues = getPropertyValues(starlightConfig, 'components');
        for (const value of componentsValues) componentPaths.add(value);

        const expressiveCodeProp = starlightConfig.properties.find(
          prop => ts.isPropertyAssignment(prop) && prop.name.getText() === 'expressiveCode'
        );
        if (expressiveCodeProp && ts.isPropertyAssignment(expressiveCodeProp)) {
          const initializer = expressiveCodeProp.initializer;
          if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
            isExpressiveCodeEnabled = false;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  for (const path of componentPaths) {
    inputs.push(toProductionEntry(path));
  }

  if (isExpressiveCodeEnabled) {
    inputs.push(toEntry('ec.config.mjs'));
  }

  return inputs;
};
