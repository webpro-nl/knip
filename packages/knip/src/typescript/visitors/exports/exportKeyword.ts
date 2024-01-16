import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { compact } from '../../../util/array.js';
import { isGetOrSetAccessorDeclaration, isPrivateMember, stripQuotes } from '../../ast-helpers.js';
import { exportVisitor as visit } from '../index.js';
import type { Fix } from '../../../types/exports.js';

export default visit(
  () => true,
  (node, { isFixExports, isFixTypes }) => {
    // @ts-expect-error TODO Property 'modifiers' does not exist on type 'Node'.
    const exportKeyword = (node.modifiers as ts.Modifier[])?.find(mod => mod.kind === ts.SyntaxKind.ExportKeyword);

    if (exportKeyword) {
      if (ts.isVariableStatement(node)) {
        // @ts-expect-error TODO Issue seems caused by mismatch between returned `node` types (but all ts.Node)
        return node.declarationList.declarations.flatMap(declaration => {
          if (ts.isObjectBindingPattern(declaration.name)) {
            // Pattern: export const { name1, name2 } = {};
            return compact(
              declaration.name.elements.map(element => {
                if (ts.isIdentifier(element.name)) {
                  const fix: Fix = isFixExports ? [element.getStart(), element.getEnd()] : undefined;
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
          } else if (ts.isArrayBindingPattern(declaration.name)) {
            // Pattern: export const [name1, name2] = [];
            return compact(
              declaration.name.elements.map(element => {
                if (ts.isBindingElement(element)) {
                  const fix: Fix = isFixExports ? [element.getStart(), element.getEnd()] : undefined;
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
          } else {
            // Pattern: export const MyVar = 1;
            const identifier = declaration.name.getText();
            const fix: Fix = isFixExports ? [exportKeyword.getStart(), exportKeyword.getEnd() + 1] : undefined;
            return {
              node: declaration,
              identifier,
              type: SymbolType.UNKNOWN,
              pos: declaration.name.getStart(),
              fix,
            };
          }
        });
      }

      // @ts-expect-error TODO Property 'modifiers' does not exist on type 'Node'.
      const defaultKeyword = (node.modifiers as ts.Modifier[])?.find(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

      if (ts.isFunctionDeclaration(node) && node.name) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();

        const pos = (node.name ?? node.body ?? node).getStart();
        const fix: Fix = isFixExports
          ? [exportKeyword.getStart(), (defaultKeyword ?? exportKeyword).getEnd() + 1]
          : undefined;
        return {
          node,
          identifier,
          pos,
          type: SymbolType.FUNCTION,
          fix,
        };
      }

      if (ts.isClassDeclaration(node) && node.name) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();

        const pos = (node.name ?? node).getStart();
        const members = node.members
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
            pos: member.name.getStart(),
            type: SymbolType.MEMBER,
            fix: undefined,
          }));
        const fix: Fix = isFixExports
          ? [exportKeyword.getStart(), (defaultKeyword ?? exportKeyword).getEnd() + 1]
          : undefined;
        return {
          node,
          identifier,
          type: SymbolType.CLASS,
          pos,
          members,
          fix,
        };
      }

      if (ts.isTypeAliasDeclaration(node)) {
        const fix: Fix = isFixTypes ? [exportKeyword.getStart(), exportKeyword.getEnd() + 1] : undefined;
        return {
          node,
          identifier: node.name.getText(),
          type: SymbolType.TYPE,
          pos: node.name.getStart(),
          fix,
        };
      }

      if (ts.isInterfaceDeclaration(node)) {
        const fix: Fix = isFixTypes ? [exportKeyword.getStart(), exportKeyword.getEnd() + 1] : undefined;
        return {
          node,
          identifier: node.name.getText(),
          type: SymbolType.INTERFACE,
          pos: node.name.getStart(),
          fix,
        };
      }

      if (ts.isEnumDeclaration(node)) {
        const identifier = defaultKeyword ? 'default' : node.name.getText();
        const pos = node.name.getStart();
        const members = node.members.map(member => ({
          node: member,
          identifier: stripQuotes(member.name.getText()),
          pos: member.name.getStart(),
          type: SymbolType.MEMBER,
          fix: undefined,
        }));
        const fix: Fix = isFixTypes ? [exportKeyword.getStart(), exportKeyword.getEnd() + 1] : undefined;
        return {
          node,
          identifier,
          type: SymbolType.ENUM,
          pos,
          members,
          fix,
        };
      }
    }
  }
);
