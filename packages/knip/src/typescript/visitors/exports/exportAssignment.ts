import ts from 'typescript';
import { FIX_FLAGS } from '../../../constants.js';
import type { Fix } from '../../../types/exports.js';
import { getClassMember, getEnumMember, getNodeType, isNonPrivateDeclaration } from '../../ast-helpers.js';
import { isModule } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isModule, (node, { isFixExports, isReportClassMembers, isFixTypes }) => {
  if (ts.isExportAssignment(node)) {
    // Patterns:
    // export default 1;
    // export = identifier;
    const pos = node.getChildAt(1).getStart();
    const fix: Fix = isFixExports ? [node.getStart(), node.getEnd() + 1, FIX_FLAGS.NONE] : undefined;
    // @ts-expect-error We need the symbol in `addExport`
    const symbol = node.getSourceFile().locals?.get(node.expression.escapedText);
    const type = getNodeType(symbol?.valueDeclaration);

    if (symbol?.valueDeclaration) {
      const decl = symbol.valueDeclaration;
      if (ts.isEnumDeclaration(decl)) {
        const members = decl.members.map(member => getEnumMember(member, isFixExports));
        return { node, symbol, identifier: 'default', type, pos, fix, members };
      }

      if (ts.isClassDeclaration(decl)) {
        const members = isReportClassMembers
          ? decl.members.filter(isNonPrivateDeclaration).map(member => getClassMember(member, isFixTypes))
          : [];
        return { node, symbol, identifier: 'default', type, pos, fix, members };
      }
    }

    return { node, symbol, identifier: 'default', type, pos, fix };
  }
});
