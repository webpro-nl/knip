import ts from 'typescript';
import { FIX_FLAGS, SYMBOL_TYPE } from '../../../constants.js';
import type { Fix } from '../../../types/exports.js';
import { compact } from '../../../util/array.js';
import {
  getClassMember,
  getDefaultKeywordNode,
  getEnumMember,
  getExportKeywordNode,
  isNonPrivatePropertyOrMethodDeclaration,
} from '../../ast-helpers.js';
import { isModule } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isModule, (node, { isFixExports, isFixTypes, isReportClassMembers }) => {
  const exportKeyword = getExportKeywordNode(node);

  if (exportKeyword) {
    const getFix = (node: ts.Node, defaultKeyword?: ts.Node): Fix =>
      isFixExports ? [node.getStart(), (defaultKeyword ?? node).getEnd() + 1, FIX_FLAGS.NONE] : undefined;

    const getTypeFix = (node: ts.Node): Fix =>
      isFixTypes ? [node.getStart(), node.getEnd() + 1, FIX_FLAGS.NONE] : undefined;

    if (ts.isVariableStatement(node)) {
      // @ts-expect-error TODO Issue seems caused by mismatch between returned `node` types (but all ts.Node)
      return node.declarationList.declarations.flatMap(declaration => {
        if (ts.isObjectBindingPattern(declaration.name)) {
          // Pattern: export const { name1, name2 } = {};
          return compact(
            declaration.name.elements.map(element => {
              if (ts.isIdentifier(element.name)) {
                const fix = isFixExports ? [element.getStart(), element.getEnd(), FIX_FLAGS.OBJECT_BINDING] : undefined;
                return {
                  node: element,
                  // @ts-expect-error We'll use the symbol in `findInternalReferences`
                  symbol: element.symbol,
                  identifier: element.name.escapedText.toString(),
                  type: SYMBOL_TYPE.UNKNOWN,
                  pos: element.name.getStart(),
                  fix,
                };
              }
            })
          );
        }
        if (ts.isArrayBindingPattern(declaration.name)) {
          // Pattern: export const [name1, name2] = [];
          return compact(
            declaration.name.elements.map(element => {
              if (ts.isBindingElement(element)) {
                const fix = isFixExports ? [element.getStart(), element.getEnd(), FIX_FLAGS.NONE] : undefined;
                return {
                  node: element,
                  // @ts-expect-error We'll use the symbol in `findInternalReferences`
                  symbol: element.symbol,
                  identifier: element.getText(),
                  type: SYMBOL_TYPE.UNKNOWN,
                  pos: element.getStart(),
                  fix,
                };
              }
            })
          );
        }

        // Pattern: export const MyVar = 1;
        const identifier = declaration.name.getText();
        const pos = declaration.name.getStart();
        const fix = getFix(exportKeyword);
        return { node: declaration, identifier, type: SYMBOL_TYPE.UNKNOWN, pos, fix };
      });
    }

    const defaultKeyword = getDefaultKeywordNode(node);

    if (ts.isFunctionDeclaration(node) && node.name) {
      const identifier = defaultKeyword ? 'default' : node.name.getText();
      const pos = (node.name ?? node.body ?? node).getStart();
      const fix = getFix(exportKeyword, defaultKeyword);
      return { node, identifier, pos, type: SYMBOL_TYPE.FUNCTION, fix };
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const identifier = defaultKeyword ? 'default' : node.name.getText();
      const pos = (node.name ?? node).getStart();
      const fix = getFix(exportKeyword, defaultKeyword);
      const members = isReportClassMembers
        ? node.members.filter(isNonPrivatePropertyOrMethodDeclaration).map(member => getClassMember(member, isFixTypes))
        : [];

      return { node, identifier, type: SYMBOL_TYPE.CLASS, pos, members, fix };
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const identifier = node.name.getText();
      const pos = node.name.getStart();
      const fix = getTypeFix(exportKeyword);
      return { node, identifier, type: SYMBOL_TYPE.TYPE, pos, fix };
    }

    if (ts.isInterfaceDeclaration(node)) {
      const identifier = defaultKeyword ? 'default' : node.name.getText();
      const pos = node.name.getStart();
      const fix = getTypeFix(exportKeyword);
      return { node, identifier, type: SYMBOL_TYPE.INTERFACE, pos, fix };
    }

    if (ts.isEnumDeclaration(node)) {
      const identifier = node.name.getText();
      const pos = node.name.getStart();
      const fix = getTypeFix(exportKeyword);
      const members = node.members.map(member => getEnumMember(member, isFixExports));
      return { node, identifier, type: SYMBOL_TYPE.ENUM, pos, members, fix };
    }
  }
});
