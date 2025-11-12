import ts from 'typescript';
import { IMPORT_MODIFIERS } from '../../../constants.js';
import { isNotJS } from '../helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(isNotJS, node => {
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    ts.isStringLiteralLike(node.moduleReference.expression)
  ) {
    // Pattern: import identifier = require('specifier')
    const specifier = node.moduleReference.expression.text;
    const alias = String(node.name.escapedText);
    return {
      specifier,
      alias,
      identifier: 'default',
      // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'ImportEqualsDeclaration'.
      symbol: node.symbol,
      pos: node.name.getStart(),
      modifiers: IMPORT_MODIFIERS.NONE,
    };
  }
});
