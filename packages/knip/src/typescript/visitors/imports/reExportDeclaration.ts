import ts from 'typescript';
import { IMPORT_FLAGS, IMPORT_STAR } from '../../../constants.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        // Re-exports
        if (!node.exportClause) {
          // Pattern: export * from 'specifier';
          return {
            identifier: IMPORT_STAR,
            specifier: node.moduleSpecifier.text,
            pos: node.moduleSpecifier.getStart() - 7,
            modifiers: IMPORT_FLAGS.RE_EXPORT,
          };
        }
        if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
          // Pattern: export * as namespace from 'specifier';
          return {
            identifier: IMPORT_STAR,
            namespace: String(node.exportClause.name.text),
            specifier: node.moduleSpecifier.text,
            pos: node.exportClause.name.getStart(),
            modifiers: IMPORT_FLAGS.RE_EXPORT,
          };
        }
        const specifier = node.moduleSpecifier; // Assign to satisfy TS
        return node.exportClause.elements.map(element => {
          if (element.propertyName && element.name) {
            // Pattern: export { identifier as otherIdentifier } from 'specifier';
            return {
              identifier: String(element.propertyName.text),
              alias: String(element.name.text),
              specifier: specifier.text,
              pos: element.propertyName.getStart(),
              modifiers: IMPORT_FLAGS.RE_EXPORT,
            };
          }
          // Pattern: export { identifier } from 'specifier';
          return {
            identifier: (element.propertyName ?? element.name).getText(),
            specifier: specifier.text,
            pos: element.name.getStart(),
            modifiers: IMPORT_FLAGS.RE_EXPORT,
          };
        });
      }
    }
  }
);
