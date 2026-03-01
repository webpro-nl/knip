import ts from 'typescript';
import { stripQuotes } from '../../../typescript/ast-helpers.ts';
import { scriptVisitor as visit } from '../../../typescript/visitors/index.ts';

export default visit(
  sourceFile => ts.getShebang(sourceFile.text) === '#!/usr/bin/env zx',
  node => {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText() === '$') {
      return stripQuotes(node.template.getText());
    }
  }
);
