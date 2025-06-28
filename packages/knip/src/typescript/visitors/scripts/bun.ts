import ts from 'typescript';
import { stripQuotes } from '../../ast-helpers.js';
import { hasImportSpecifier } from '../helpers.js';
import { scriptVisitor as visit } from '../index.js';

export default visit(
  sourceFile => sourceFile.statements.some(node => hasImportSpecifier(node, 'bun', '$')),
  node => {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText() === '$') {
      return stripQuotes(node.template.getText());
    }
  }
);
