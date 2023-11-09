import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { stripQuotes } from '../../ast-helpers.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isJS, node => {
  if (ts.isExpressionStatement(node)) {
    if (ts.isBinaryExpression(node.expression)) {
      if (
        ts.isPropertyAccessExpression(node.expression.left) &&
        ts.isPropertyAccessExpression(node.expression.left.expression) &&
        ts.isIdentifier(node.expression.left.expression.expression) &&
        node.expression.left.expression.expression.escapedText === 'module' &&
        node.expression.left.expression.name.escapedText === 'exports'
      ) {
        // Pattern: module.exports.NAME
        const identifier = node.expression.left.name.getText();
        const pos = node.expression.left.name.pos;
        return { node, identifier, type: SymbolType.UNKNOWN, pos };
      } else if (
        ts.isElementAccessExpression(node.expression.left) &&
        ts.isPropertyAccessExpression(node.expression.left.expression) &&
        ts.isIdentifier(node.expression.left.expression.name) &&
        ts.isIdentifier(node.expression.left.expression.expression) &&
        node.expression.left.expression.expression.escapedText === 'module' &&
        node.expression.left.expression.name.escapedText === 'exports'
      ) {
        // Pattern: module.exports['NAME']
        const identifier = stripQuotes(node.expression.left.argumentExpression.getText());
        const pos = node.expression.left.argumentExpression.pos;
        return { node, identifier, type: SymbolType.UNKNOWN, pos };
      } else if (
        ts.isPropertyAccessExpression(node.expression.left) &&
        ts.isIdentifier(node.expression.left.expression) &&
        node.expression.left.expression.escapedText === 'module' &&
        node.expression.left.name.escapedText === 'exports'
      ) {
        const expr = node.expression.right;
        if (ts.isObjectLiteralExpression(expr) && expr.properties.every(ts.isShorthandPropertyAssignment)) {
          // Pattern: module.exports = { identifier, identifier2 }
          return expr.properties.map(node => {
            return { node, identifier: node.getText(), type: SymbolType.UNKNOWN, pos: node.pos };
          });
        } else {
          // Pattern: module.exports = any
          return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos: expr.pos };
        }
      }
    }
  }
});
