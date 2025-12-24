import ts from 'typescript';
import { IMPORT_FLAGS, IMPORT_STAR } from '../../../constants.js';
import type { ImportNode } from '../../../types/imports.js';
import { importVisitor as visit } from '../index.js';

const supportsJSDocImportTag = 'isJSDocImportTag' in ts;

const getImportSpecifiers = (node: ts.JSDocTag) => {
  const imports: ImportNode[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportTypeNode(node)) {
      const importClause = node.argument;
      if (ts.isLiteralTypeNode(importClause) && ts.isStringLiteral(importClause.literal)) {
        const identifier =
          node.qualifier && ts.isIdentifier(node.qualifier) ? String(node.qualifier.escapedText) : 'default';
        imports.push({
          specifier: importClause.literal.text,
          identifier,
          pos: node.qualifier?.getStart() ?? importClause.literal.pos,
          modifiers: IMPORT_FLAGS.TYPE_ONLY,
          alias: undefined,
          namespace: undefined,
          symbol: undefined,
        });
      }
    }

    // biome-ignore lint: suspicious/noTsIgnore
    // @ts-ignore ts.isJSDocImportTag/node.moduleSpecifier/node.importClause added in TS v5.5.0
    if (supportsJSDocImportTag && ts.isJSDocImportTag(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      // biome-ignore lint: suspicious/noTsIgnore
      // @ts-ignore node.moduleSpecifier added in TS v5.5.0
      const moduleSpecifier = node.moduleSpecifier;
      // biome-ignore lint: suspicious/noTsIgnore
      // @ts-ignore node.importClause added in TS v5.5.0
      const importClause = node.importClause;
      if (moduleSpecifier && importClause?.namedBindings && ts.isNamedImportBindings(importClause.namedBindings)) {
        const bindings = importClause.namedBindings;
        if (ts.isNamespaceImport(bindings)) {
          imports.push({
            specifier: moduleSpecifier.text,
            identifier: IMPORT_STAR,
            pos: bindings.name.getStart(),
            modifiers: IMPORT_FLAGS.TYPE_ONLY,
            alias: undefined,
            namespace: undefined,
            symbol: undefined,
          });
        } else {
          for (const element of bindings.elements) {
            imports.push({
              specifier: moduleSpecifier.text,
              // biome-ignore lint: suspicious/noTsIgnore
              // @ts-ignore <sigh>
              identifier: String((element.propertyName ?? element.name).escapedText),
              pos: element.name.getStart(),
              modifiers: IMPORT_FLAGS.TYPE_ONLY,
              alias: undefined,
              namespace: undefined,
              symbol: undefined,
            });
          }
        }
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
