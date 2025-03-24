import ts from 'typescript';
import { stripQuotes } from '../../typescript/ast-helpers.js';

export const getPageExtensions = (sourceFile: ts.SourceFile) => {
  const pageExtensions: Set<string> = new Set();

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const pageExtensionsProp = node.properties.find(
        prop => ts.isPropertyAssignment(prop) && prop.name.getText() === 'pageExtensions'
      );

      if (pageExtensionsProp && ts.isPropertyAssignment(pageExtensionsProp)) {
        const initializer = pageExtensionsProp.initializer;
        if (ts.isArrayLiteralExpression(initializer)) {
          for (const element of initializer.elements) {
            if (ts.isStringLiteral(element)) pageExtensions.add(stripQuotes(element.getText()));
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return Array.from(pageExtensions);
};
