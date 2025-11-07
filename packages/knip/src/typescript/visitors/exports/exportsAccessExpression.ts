import ts from 'typescript';
import { FIX_FLAGS, SYMBOL_TYPE } from '../../../constants.js';
import type { Fix } from '../../../types/exports.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isJS, (node, { isFixExports }) => {
  if (ts.isBinaryExpression(node) && ts.isPropertyAccessExpression(node.left)) {
    if (ts.isIdentifier(node.left.expression) && node.left.expression.escapedText === 'exports') {
      // Pattern: exports.NAME
      const identifier = node.left.name.getText();
      const pos = node.left.name.pos;
      const fix: Fix = isFixExports ? [node.getStart(), node.getEnd(), FIX_FLAGS.NONE] : undefined;
      return {
        node: node.left.name,
        identifier,
        type: SYMBOL_TYPE.UNKNOWN,
        pos,
        fix,
      };
    }
  }
});
