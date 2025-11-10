import ts from 'typescript';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL') {
      if (
        node.arguments &&
        node.arguments.length >= 2 &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        ts.isPropertyAccessExpression(node.arguments[1]) &&
        ts.isMetaProperty(node.arguments[1].expression) &&
        node.arguments[1].expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
        node.arguments[1].expression.name.text === 'meta' &&
        node.arguments[1].name.text === 'url'
      ) {
        const specifier = node.arguments[0].text;
        if (specifier) return { specifier, identifier: undefined, pos: node.arguments[0].pos, resolve: true };
      }
    }
  }
);
