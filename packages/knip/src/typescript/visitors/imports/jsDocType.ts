import ts from 'typescript';
import { importVisitor as visit } from '../index.js';

const extractImportSpecifiers = (node: ts.JSDocTag) => {
  const importSpecifiers: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isJSDocTypeExpression(node)) {
      const typeNode = node.type;
      if (ts.isTypeReferenceNode(typeNode) && typeNode.typeArguments) {
        typeNode.typeArguments.forEach(arg => {
          if (ts.isImportTypeNode(arg)) {
            const importClause = arg.argument;
            if (ts.isLiteralTypeNode(importClause) && ts.isStringLiteral(importClause.literal)) {
              importSpecifiers.push(importClause.literal.text);
            }
          }
        });
      }
    }
    if (ts.isJSDocTypeTag(node)) {
      const typeNode = node.typeExpression?.type;
      if (ts.isImportTypeNode(typeNode)) {
        const importClause = typeNode.argument;
        if (ts.isLiteralTypeNode(importClause) && ts.isStringLiteral(importClause.literal)) {
          importSpecifiers.push(importClause.literal.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(node);

  return importSpecifiers;
};

export default visit(
  () => true,
  node => {
    if ('jsDoc' in node && node.jsDoc) {
      const jsDoc = node.jsDoc as ts.JSDoc[];
      if (jsDoc.length > 0 && jsDoc[0].parent.parent === node.parent) {
        return jsDoc
          .flatMap(jsDoc => (jsDoc.tags ?? []).flatMap(extractImportSpecifiers))
          .map(specifier => ({ specifier }));
      }
    }
    return [];
  }
);
