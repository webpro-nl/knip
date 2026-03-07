import ts from 'typescript';
import { stripQuotes } from '../../ast-helpers.ts';
import { hasImportSpecifier } from '../helpers.ts';
import { scriptVisitor as visit } from '../index.ts';

export default visit(
  sourceFile => sourceFile.statements.some(node => hasImportSpecifier(node, 'bun', '$')),
  node => {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText() === '$') {
      return stripQuotes(node.template.getText());
    }
  }
);
