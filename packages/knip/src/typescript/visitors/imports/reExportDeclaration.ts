import ts from 'typescript';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        // Re-exports
        if (!node.exportClause) {
          // Pattern: export * from 'specifier';
          return { identifier: '*', specifier: node.moduleSpecifier.text, isReExport: true, pos: node.pos };
        }
        if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
          // Pattern: export * as namespace from 'specifier';
          return {
            identifier: '*',
            namespace: node.exportClause.name.escapedText,
            specifier: node.moduleSpecifier.text,
            isReExport: true,
            pos: node.exportClause.name.pos,
          };
        }
        const specifier = node.moduleSpecifier; // Assign to satisfy TS
        return node.exportClause.elements.map(element => {
          if (element.propertyName && element.name) {
            // Pattern: export { identifier as otherIdentifier } from 'specifier';
            return {
              identifier: String(element.name.escapedText),
              namespace: element.propertyName.escapedText,
              specifier: specifier.text,
              isReExport: true,
              pos: element.pos,
            };
          }
          // Pattern: export { identifier } from 'specifier';
          return {
            identifier: (element.propertyName ?? element.name).getText(),
            specifier: specifier.text,
            isReExport: true,
            pos: element.pos,
          };
        });
      }
    }
  }
);
