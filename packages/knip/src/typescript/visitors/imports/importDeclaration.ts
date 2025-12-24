import ts from 'typescript';
import { IMPORT_FLAGS, IMPORT_STAR } from '../../../constants.js';
import { isDefaultImport } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!node.importClause) {
        // Pattern: import 'side-effects';
        return {
          specifier,
          identifier: undefined,
          pos: node.pos,
          modifiers: IMPORT_FLAGS.SIDE_EFFECTS,
          alias: undefined,
          namespace: undefined,
          symbol: undefined,
        };
      }

      const imports = [];

      const modifiers = node.importClause.isTypeOnly ? IMPORT_FLAGS.TYPE_ONLY : IMPORT_FLAGS.NONE;

      if (isDefaultImport(node)) {
        // Pattern: import identifier from 'specifier'
        imports.push({
          identifier: 'default',
          alias: String(node.importClause.name?.escapedText),
          specifier,
          // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'ImportClause'.
          symbol: node.importClause.symbol,
          pos: node.importClause.name?.getStart() ?? node.getStart(),
          modifiers,
          namespace: undefined,
        });
      }

      if (node.importClause?.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Pattern: import * as NS from 'specifier'
          // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'NamespaceImport'.
          const symbol = node.importClause.namedBindings.symbol;
          imports.push({
            symbol,
            specifier,
            identifier: IMPORT_STAR,
            pos: node.importClause.namedBindings.name.getStart(),
            modifiers,
            alias: undefined,
            namespace: undefined,
          });
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
              pos: element.name.getStart(),
              modifiers,
              alias: undefined,
              namespace: undefined,
            });
          }
        }
        if (imports.length === 0) {
          // Pattern: import type {} from 'specifier';
          imports.push({
            specifier,
            identifier: undefined,
            pos: node.importClause.namedBindings.pos,
            modifiers,
            alias: undefined,
            symbol: undefined,
            namespace: undefined,
          });
        }
      }

      return imports;
    }
  }
);
