import ts from 'typescript';
import { ANONYMOUS } from '../../../constants.js';
import {
  findAncestor,
  findDescendants,
  isAccessExpression,
  isImportCall,
  isTopLevel,
  stripQuotes,
} from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

// @ts-expect-error Property 'symbol' does not exist on type 'BindingElement', etc.
const getSymbol = (node: ts.Node, isTopLevel: boolean) => (isTopLevel ? node.symbol : undefined);

export default visit(
  () => true,
  node => {
    if (isImportCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;

        if (specifier) {
          const accessExpression = findAncestor<ts.AccessExpression>(node, _node => {
            if (ts.isExpressionStatement(_node) || ts.isCallExpression(_node)) return 'STOP';
            return isAccessExpression(_node);
          });

          if (accessExpression) {
            if (ts.isPropertyAccessExpression(accessExpression) && accessExpression.name) {
              const identifier = String(accessExpression.name.escapedText);
              const pos = accessExpression.name.pos;
              if (identifier === 'then') {
                const callExpression = node.parent.parent;
                if (ts.isCallExpression(callExpression) && ts.isFunctionLike(callExpression.arguments[0])) {
                  const arg = callExpression.arguments[0].parameters[0];
                  if (arg && ts.isIdentifier(arg.name)) {
                    const argName = arg.name.escapedText;
                    const accessExpressions = findDescendants<ts.PropertyAccessExpression>(
                      callExpression.arguments[0].body,
                      ts.isPropertyAccessExpression
                    ).filter(binding => binding.expression.getText() === argName);
                    if (accessExpressions.length > 0) {
                      // Pattern: import('specifier').then(module => module.identifier);
                      return accessExpressions.map(binding => {
                        const identifier = String(binding.name.escapedText);
                        return { identifier, specifier, pos };
                      });
                    }
                  } else if (arg && ts.isObjectBindingPattern(arg.name)) {
                    // Pattern: import('specifier').then({ identifier } => identifier);
                    return arg.name.elements.map(element => {
                      const identifier = (element.propertyName ?? element.name).getText();
                      const alias = element.propertyName ? element.name.getText() : undefined;
                      return { identifier, alias, specifier, pos: element.pos };
                    });
                  }
                }
                return { identifier: 'default', specifier, pos };
              }

              const variableDeclaration = findAncestor<ts.AccessExpression>(accessExpression, _node => {
                if (ts.isCallExpression(_node) || ts.isSourceFile(_node)) return 'STOP';
                return ts.isVariableDeclaration(_node);
              });

              if (variableDeclaration) {
                // @ts-expect-error TODO FIXME Property 'name' does not exist on type 'ElementAccessExpression'.
                const alias = String(variableDeclaration.name.escapedText);
                const symbol = getSymbol(variableDeclaration, isTopLevel(variableDeclaration.parent));
                return { identifier, alias, symbol, specifier, pos };
              }

              // Pattern: import('side-effects')
              return { identifier, specifier, pos };
            }

            if (
              ts.isElementAccessExpression(accessExpression) &&
              ts.isStringLiteral(accessExpression.argumentExpression)
            ) {
              const name = stripQuotes(accessExpression.argumentExpression.text);
              const pos = accessExpression.argumentExpression.pos;
              const identifier = name;
              // Pattern: import('side-effects').identifier
              return { identifier, specifier, pos };
            }
          } else {
            const variableDeclaration = node.parent.parent;
            if (
              ts.isVariableDeclaration(variableDeclaration) &&
              ts.isVariableDeclarationList(variableDeclaration.parent)
            ) {
              const isTLA = isTopLevel(variableDeclaration.parent);
              if (ts.isIdentifier(variableDeclaration.name)) {
                // Pattern: const identifier = await import('specifier');
                const alias = String(variableDeclaration.name.escapedText);
                const symbol = getSymbol(variableDeclaration, isTLA);
                return { identifier: 'default', alias, symbol, specifier, pos: node.arguments[0].pos };
              }
              const bindings = findDescendants<ts.BindingElement>(variableDeclaration, ts.isBindingElement);
              if (bindings.length > 0) {
                // Pattern: const { identifier } = await import('specifier');
                return bindings.map(element => {
                  const identifier = (element.propertyName ?? element.name).getText();
                  const alias = element.propertyName ? element.name.getText() : undefined;
                  const symbol = getSymbol(element, isTLA);
                  return { identifier, alias, symbol, specifier, pos: element.pos };
                });
              }
              // Pattern: import('specifier')
              return { identifier: ANONYMOUS, specifier, pos: node.arguments[0].pos };
            }
            const arrayLiteralExpression = node.parent;
            const variableDeclarationParent = node.parent.parent?.parent?.parent;
            if (
              ts.isArrayLiteralExpression(arrayLiteralExpression) &&
              variableDeclarationParent &&
              ts.isVariableDeclarationList(variableDeclarationParent.parent) &&
              ts.isVariableDeclaration(variableDeclarationParent) &&
              ts.isArrayBindingPattern(variableDeclarationParent.name)
            ) {
              const index = arrayLiteralExpression.elements.indexOf(node); // ts.indexOfNode is internal
              const element = variableDeclarationParent.name.elements[index];
              if (element) {
                const isTL = isTopLevel(variableDeclarationParent.parent);
                if (ts.isBindingElement(element) && ts.isObjectBindingPattern(element.name) && element.name.elements) {
                  // Pattern: const [{ a }, { default: b, c }] = await Promise.all([import('A'), import('B')]);
                  return element.name.elements.map(element => {
                    const identifier = (element.propertyName ?? element.name).getText();
                    const alias = element.propertyName ? element.name.getText() : undefined;
                    const symbol = getSymbol(element, isTL);
                    return { identifier, alias, symbol, specifier, pos: element.pos };
                  });
                }

                if (!ts.isOmittedExpression(element) && ts.isIdentifier(element.name)) {
                  // Pattern: const [a, b] = await Promise.all([import('A'), import('B')]);
                  const alias = String(element.name.escapedText);
                  const symbol = getSymbol(element, isTL);
                  return { identifier: 'default', symbol, alias, specifier, pos: element.pos };
                }

                return { identifier: 'default', specifier, pos: element.pos };
              }
            }

            // Pattern: import('side-effects')
            return { identifier: 'default', specifier, pos: node.arguments[0].pos };
          }
        }

        // Fallback, seems to never happen though
        return { specifier, identifier: 'default', pos: node.arguments[0].pos };
      }
    }
  }
);
