import ts from 'typescript';
import { isConstructorCall } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    // Pattern: new URL('specifier', import.meta.url)
    if (isConstructorCall(node, 'URL')) {
      if (
        node.arguments.length === 2 &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        ts.isPropertyAccessExpression(node.arguments[1]) &&
        node.arguments[1].getText() === 'import.meta.url'
      ) {
        const specifier = node.arguments[0].text;
        if (specifier) return { specifier };
      }
    }
  }
);
