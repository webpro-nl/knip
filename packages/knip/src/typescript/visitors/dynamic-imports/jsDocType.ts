import ts from 'typescript';
import { importVisitor as visit } from '../index.js';
import type { ImportNode } from '../../../types/imports.js';

const getImportSpecifiers = (node: ts.JSDocTag) => {
  const imports: ImportNode[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportTypeNode(node)) {
      const importClause = node.argument;
      if (ts.isLiteralTypeNode(importClause) && ts.isStringLiteral(importClause.literal)) {
        const identifier =
          node.qualifier && ts.isIdentifier(node.qualifier) ? String(node.qualifier.escapedText) : 'default';
        imports.push({ specifier: importClause.literal.text, identifier, pos: undefined });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(node);

  return imports;
};

export default visit(
  () => true,
  node => {
    if ('jsDoc' in node && node.jsDoc) {
      const jsDoc = node.jsDoc as ts.JSDoc[];
      if (jsDoc.length > 0 && jsDoc[0].parent.parent === node.parent) {
        return jsDoc.flatMap(jsDoc => (jsDoc.tags ?? []).flatMap(getImportSpecifiers));
      }
    }
    return [];
  }
);
