import ts from 'typescript';
import { stripQuotes } from '../../../util/string.js';
import { scriptVisitor as visit } from '../index.js';

export default visit(
  sourceFile => ts.getShebang(sourceFile.text) === '#!/usr/bin/env zx',
  node => {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText() === '$') {
      return stripQuotes(node.template.getText());
    }
  }
);
