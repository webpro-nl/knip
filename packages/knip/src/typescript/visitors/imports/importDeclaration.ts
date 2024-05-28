import ts from 'typescript';
import { IMPORT_STAR } from '../../../constants.js';
import { isDefaultImport } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!node.importClause) {
        // Pattern: import 'side-effects';
        return { specifier, identifier: undefined, pos: node.pos };
      }
      const imports = [];

      if (isDefaultImport(node)) {
        // Pattern: import identifier from 'specifier'
        imports.push({
          identifier: 'default',
          alias: String(node.importClause.name?.escapedText),
          specifier,
          // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'ImportClause'.
          symbol: node.importClause.symbol,
          pos: node.moduleSpecifier.pos,
        });
      }

      if (node.importClause?.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Pattern: import * as NS from 'specifier'
          // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'NamespaceImport'.
          const symbol = node.importClause.namedBindings.symbol;
          imports.push({ symbol, specifier, identifier: IMPORT_STAR, pos: symbol?.declarations[0]?.pos ?? node.pos });
        }
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Pattern: import { identifier as NS } from 'specifier'
          for (const element of node.importClause.namedBindings.elements) {
            const identifier = (element.propertyName ?? element.name).getText();
            imports.push({
              identifier,
              specifier,
              // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'ImportSpecifier'.
              symbol: element.symbol,
              isTypeOnly: node.importClause?.isTypeOnly,
              pos: element.pos,
            });
          }
        }
      }

      return imports;
    }
  }
);
