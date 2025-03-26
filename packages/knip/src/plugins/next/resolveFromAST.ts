import ts from 'typescript';
import { getPropertyValues } from '../../typescript/ast-helpers.js';

export const getPageExtensions = (sourceFile: ts.SourceFile) => {
  const pageExtensions: Set<string> = new Set();

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const values = getPropertyValues(node, 'pageExtensions');
      for (const value of values) pageExtensions.add(value);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return Array.from(pageExtensions);
};
