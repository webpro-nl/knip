import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';
import type { Fix } from '../../../types/exports.js';

export default visit(isJS, (node, { isFixExports }) => {
  if (ts.isBinaryExpression(node) && ts.isPropertyAccessExpression(node.left)) {
    if (ts.isIdentifier(node.left.expression) && node.left.expression.escapedText === 'exports') {
      // Pattern: exports.NAME
      const identifier = node.left.name.getText();
      const pos = node.left.name.pos;
      const fix: Fix = isFixExports ? [node.getStart(), node.getEnd()] : undefined;
      return {
        node: node.left.name,
        identifier,
        type: SymbolType.UNKNOWN,
        pos,
        fix,
      };
    }
  }
});
