import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { stripQuotes } from '../../ast-helpers.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';
import type { ExportPos } from '../../../types/exports.js';

const isModuleExportsAccess = (node: ts.PropertyAccessExpression) =>
  ts.isIdentifier(node.expression) && node.expression.escapedText === 'module' && node.name.escapedText === 'exports';

export default visit(isJS, (node, { isFixExports }) => {
  if (ts.isExpressionStatement(node)) {
    if (ts.isBinaryExpression(node.expression)) {
      if (ts.isPropertyAccessExpression(node.expression.left)) {
        if (
          ts.isPropertyAccessExpression(node.expression.left.expression) &&
          isModuleExportsAccess(node.expression.left.expression)
        ) {
          // Pattern: module.exports.NAME
          const identifier = node.expression.left.name.getText();
          const pos = node.expression.left.name.pos;
          const fix: ExportPos = isFixExports ? [node.getStart(), node.getEnd()] : [];
          return {
            node: node.expression.left.name,
            identifier,
            type: SymbolType.UNKNOWN,
            pos,
            fix,
          };
        } else if (isModuleExportsAccess(node.expression.left)) {
          const expr = node.expression.right;
          if (ts.isObjectLiteralExpression(expr) && expr.properties.every(ts.isShorthandPropertyAssignment)) {
            // Pattern: module.exports = { identifier, identifier2 }
            return expr.properties.map(node => {
              const fix: ExportPos = isFixExports ? [node.getStart(), node.getEnd()] : [];
              return { node, identifier: node.getText(), type: SymbolType.UNKNOWN, pos: node.pos, fix };
            });
          } else {
            // Pattern: module.exports = any
            return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos: expr.pos, fix: [] };
          }
        }
      } else if (
        ts.isElementAccessExpression(node.expression.left) &&
        ts.isPropertyAccessExpression(node.expression.left.expression) &&
        ts.isIdentifier(node.expression.left.expression.name) &&
        isModuleExportsAccess(node.expression.left.expression)
      ) {
        // Pattern: module.exports['NAME']
        const identifier = stripQuotes(node.expression.left.argumentExpression.getText());
        const pos = node.expression.left.argumentExpression.pos;
        const fix: ExportPos = isFixExports ? [node.getStart(), node.getEnd()] : [];
        return {
          node: node.expression.left.argumentExpression,
          identifier,
          type: SymbolType.UNKNOWN,
          pos,
          fix,
        };
      }
    }
  }
});
