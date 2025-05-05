import ts from 'typescript';
import { getPropertyValues } from '../../typescript/ast-helpers.js';

export const getSrcDir = (sourceFile: ts.SourceFile): string => {
  let srcDir = 'src';

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const values = getPropertyValues(node, 'srcDir');
      if (values.size > 0) {
        srcDir = Array.from(values)[0];
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return srcDir;
};
