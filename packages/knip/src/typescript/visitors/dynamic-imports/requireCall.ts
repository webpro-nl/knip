import ts from 'typescript';
import { findAncestor, findDescendants, isRequireCall, isTopLevel } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isRequireCall(node)) {
      if (ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;

        if (specifier) {
          const propertyAccessExpression = findAncestor<ts.PropertyAccessExpression>(node, _node => {
            if (ts.isExpressionStatement(_node) || ts.isCallExpression(_node)) return 'STOP';
            return ts.isPropertyAccessExpression(_node);
          });

          if (propertyAccessExpression) {
            // Pattern: require('side-effects').identifier
            const identifier = String(propertyAccessExpression.name.escapedText);
            return { identifier, specifier, pos: propertyAccessExpression.name.pos };
          }
          const variableDeclaration = node.parent;
          if (
            ts.isVariableDeclaration(variableDeclaration) &&
            ts.isVariableDeclarationList(variableDeclaration.parent)
          ) {
            const isTLA = isTopLevel(variableDeclaration.parent);
            if (ts.isIdentifier(variableDeclaration.name)) {
              // Pattern: identifier = require('specifier')
              const alias = String(variableDeclaration.name.escapedText);
              return {
                identifier: 'default',
                alias,
                // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'VariableDeclaration'.
                symbol: isTLA ? variableDeclaration.symbol : undefined,
                specifier,
                pos: node.arguments[0].pos,
              };
            }
            const bindings = findDescendants<ts.BindingElement>(variableDeclaration, ts.isBindingElement);
            if (bindings.length > 0) {
              // Pattern: { identifier } = require('specifier')
              return bindings.map(element => {
                const identifier = (element.propertyName ?? element.name).getText();
                const alias = element.propertyName ? element.name.getText() : undefined;
                // @ts-expect-error TODO FIXME Property 'symbol' does not exist on type 'BindingElement'.
                return { identifier, specifier, alias, symbol: isTLA ? element.symbol : undefined, pos: element.pos };
              });
            }
            // Pattern: require('specifier')
            return { identifier: 'default', specifier, pos: node.arguments[0].pos };
          }
          // Pattern: require('side-effects')
          return { identifier: 'default', specifier, pos: node.arguments[0].pos };
        }
      }
    }
  }
);
