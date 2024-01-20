import ts from 'typescript';
import { stripQuotes } from '../../ast-helpers.js';
import { hasImportSpecifier } from '../helpers.js';
import { scriptVisitor as visit } from '../index.js';

export default visit(
  sourceFile => sourceFile.statements.some(node => hasImportSpecifier(node, 'execa')),
  node => {
    if (ts.isTaggedTemplateExpression(node)) {
      if (node.tag.getText() === '$' || (ts.isCallExpression(node.tag) && node.tag.expression.getText() === '$')) {
        return stripQuotes(node.template.getText());
      }
    }
  }
);
