import ts from 'typescript';
import { EMPTY_ARRAY, FIX_FLAGS } from '../../../constants.ts';
import type { Fix } from '../../../types/exports.ts';
import { getClassMember, getEnumMember, getNodeType, isNonPrivateDeclaration } from '../../ast-helpers.ts';
import { isModule } from '../helpers.ts';
import { exportVisitor as visit } from '../index.ts';

export default visit(isModule, (node, { isFixExports, isReportClassMembers, isFixTypes }) => {
  if (ts.isExportAssignment(node)) {
    // Patterns:
    // export default 1;
    // export = identifier;
    const pos = node.expression.getStart();
    const fix: Fix = isFixExports ? [node.getStart(), node.getEnd() + 1, FIX_FLAGS.NONE] : undefined;
    // @ts-expect-error We need the symbol in `addExport`
    const symbol = node.getSourceFile().locals?.get(node.expression.escapedText);
    const type = getNodeType(symbol?.valueDeclaration);

    if (symbol?.valueDeclaration) {
      const decl = symbol.valueDeclaration;
      if (ts.isEnumDeclaration(decl)) {
        const members = decl.members.map(member => getEnumMember(member, isFixExports));
        return { node, symbol, identifier: 'default', type, pos, fix, members, jsDocTags: undefined };
      }

      if (ts.isClassDeclaration(decl)) {
        const members = isReportClassMembers
          ? decl.members.filter(isNonPrivateDeclaration).map(member => getClassMember(member, isFixTypes))
          : EMPTY_ARRAY;
        return { node, symbol, identifier: 'default', type, pos, fix, members, jsDocTags: undefined };
      }
    }

    return { node, symbol, identifier: 'default', type, pos, fix, members: EMPTY_ARRAY, jsDocTags: undefined };
  }
});
