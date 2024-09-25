import ts from 'typescript';
import type { Fix } from '../../../types/exports.js';
import { SymbolType } from '../../../types/issues.js';
import { compact } from '../../../util/array.js';
import {
  getDefaultKeywordNode,
  getExportKeywordNode,
  isGetOrSetAccessorDeclaration,
  isPrivateMember,
  stripQuotes,
} from '../../ast-helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  (node, { isFixExports, isFixTypes, isReportClassMembers }) => {
    const exportKeyword = getExportKeywordNode(node);

    if (exportKeyword) {
      const getFix = (node: ts.Node, defaultKeyword?: ts.Node): Fix =>
        isFixExports ? { pos: [node.getStart(), (defaultKeyword ?? node).getEnd() + 1] } : undefined;
      const getElementFix = (node: ts.Node): Fix =>
        isFixExports ? { pos: [node.getStart(), node.getEnd()] } : undefined;
      const getTypeFix = (node: ts.Node): Fix =>
        isFixTypes ? { pos: [node.getStart(), node.getEnd() + 1] } : undefined;

      if (ts.isVariableStatement(node)) {
        // @ts-expect-error TODO Issue seems caused by mismatch between returned `node` types (but all ts.Node)
        return node.declarationList.declarations.flatMap(declaration => {
          if (ts.isObjectBindingPattern(declaration.name)) {
            // Pattern: export const { name1, name2 } = {};
            return compact(
              declaration.name.elements.map(element => {
                if (ts.isIdentifier(element.name)) {
                  const fix = getElementFix(element);
                  return {
                    node: element,
                    identifier: element.name.escapedText.toString(),
                    type: SymbolType.UNKNOWN,
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
                  const fix = getElementFix(element);
                  return {
                    node: element,
                    identifier: element.getText(),
                    type: SymbolType.UNKNOWN,
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
          return { node: declaration, identifier, type: SymbolType.UNKNOWN, pos, fix };
        });
      }

      const defaultKeyword = getDefaultKeywordNode(node);

      if (ts.isFunctionDeclaration(node) && node.name) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();
        const pos = (node.name ?? node.body ?? node).getStart();
        const fix = getFix(exportKeyword, defaultKeyword);
        return { node, identifier, pos, type: SymbolType.FUNCTION, fix };
      }

      if (ts.isClassDeclaration(node) && node.name) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();
        const pos = (node.name ?? node).getStart();
        const fix = getFix(exportKeyword, defaultKeyword);
        const members = isReportClassMembers
          ? node.members
              .filter(
                (member): member is ts.MethodDeclaration | ts.PropertyDeclaration =>
                  (ts.isPropertyDeclaration(member) ||
                    ts.isMethodDeclaration(member) ||
                    isGetOrSetAccessorDeclaration(member)) &&
                  !isPrivateMember(member)
              )
              .map(member => ({
                node: member,
                identifier: member.name.getText(),
                // Naive, but [does.the.job()]
                pos: member.name.getStart() + (ts.isComputedPropertyName(member.name) ? 1 : 0),
                type: SymbolType.MEMBER,
                fix: undefined,
              }))
          : [];

        return { node, identifier, type: SymbolType.CLASS, pos, members, fix };
      }

      if (ts.isTypeAliasDeclaration(node)) {
        const identifier = node.name.getText();
        const pos = node.name.getStart();
        const fix = getTypeFix(exportKeyword);
        return { node, identifier, type: SymbolType.TYPE, pos, fix };
      }

      if (ts.isInterfaceDeclaration(node)) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();
        const pos = node.name.getStart();
        const fix = getTypeFix(exportKeyword);
        return { node, identifier, type: SymbolType.INTERFACE, pos, fix };
      }

      if (ts.isEnumDeclaration(node)) {
        const identifier = node.name.getText();
        const pos = node.name.getStart();
        const fix = getTypeFix(exportKeyword);
        const members = node.members.map(member => ({
          node: member,
          identifier: stripQuotes(member.name.getText()),
          pos: member.name.getStart(),
          type: SymbolType.MEMBER,
          fix: undefined,
        }));

        return { node, identifier, type: SymbolType.ENUM, pos, members, fix };
      }
    }
  }
);
