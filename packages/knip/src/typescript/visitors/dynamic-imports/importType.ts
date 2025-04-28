import ts from 'typescript';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isImportTypeNode(node)) {
      if (ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
        return { specifier: node.argument.literal.text, identifier: undefined, pos: 0, isTypeOnly: true };
      }
    }
  }
);
