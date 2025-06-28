import ts from 'typescript';
import { isPropertyAccessCall } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isPropertyAccessCall(node, 'require.resolve') || isPropertyAccessCall(node, 'import.meta.resolve')) {
      // Pattern: require.resolve('specifier')
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        if (specifier) return { specifier, identifier: undefined, pos: node.arguments[0].pos, resolve: true };
      }
    }
  }
);
