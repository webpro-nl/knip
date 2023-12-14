import ts from 'typescript';
import { isImportCall, findDescendants, findAncestor, isAccessExpression, stripQuotes } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isImportCall(node)) {
      // Pattern: import('specifier')
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
                  // Pattern: import('specifier').then(module => module.identifier);
                  const arg = callExpression.arguments[0].parameters[0];
                  if (ts.isIdentifier(arg.name)) {
                    const argName = arg.name.escapedText;
                    const accessExpressions = findDescendants<ts.PropertyAccessExpression>(
                      callExpression.arguments[0].body,
                      ts.isPropertyAccessExpression
                    ).filter(binding => binding.expression.getText() === argName);
                    if (accessExpressions.length > 0) {
                      return accessExpressions.map(binding => {
                        const identifier = String(binding.name.escapedText);
                        return { identifier, specifier, pos };
                      });
                    }
                  }
                }
                return { identifier: 'default', specifier, pos };
              }

              // Pattern: import('side-effects')
              return { identifier, specifier, pos };
            }

            if (
              ts.isElementAccessExpression(accessExpression) &&
              ts.isStringLiteral(accessExpression.argumentExpression)
            ) {
              // Pattern: import('side-effects').identifier
              const name = stripQuotes(accessExpression.argumentExpression.text);
              const pos = accessExpression.argumentExpression.pos;
              const identifier = name;
              return { identifier, specifier, pos };
            }
          } else {
            const variableDeclaration = node.parent.parent;
            if (
              ts.isVariableDeclaration(variableDeclaration) &&
              ts.isVariableDeclarationList(variableDeclaration.parent)
            ) {
              if (ts.isIdentifier(variableDeclaration.name)) {
                // Pattern: const identifier = await import('specifier');
                return { identifier: 'default', specifier, pos: node.arguments[0].pos };
              } else {
                const bindings = findDescendants<ts.BindingElement>(variableDeclaration, ts.isBindingElement);
                if (bindings.length > 0) {
                  // Pattern: const { identifier } = await import('specifier');
                  return bindings.map(element => {
                    const identifier = (element.propertyName ?? element.name).getText();
                    return { identifier, specifier, pos: element.pos };
                  });
                } else {
                  // Pattern: import('specifier')
                  return { identifier: 'default', specifier, pos: node.arguments[0].pos };
                }
              }
            } else {
              const arrayLiteralExpression = node.parent;
              const variableDeclaration = node.parent.parent?.parent?.parent;
              if (
                ts.isArrayLiteralExpression(arrayLiteralExpression) &&
                variableDeclaration &&
                ts.isVariableDeclarationList(variableDeclaration.parent) &&
                ts.isVariableDeclaration(variableDeclaration) &&
                ts.isArrayBindingPattern(variableDeclaration.name)
              ) {
                // Pattern: const [a, { default: b, c }] = await Promise.all([import('A'), import('B')]);
                const index = arrayLiteralExpression.elements.indexOf(node); // ts.indexOfNode is internal
                const element = variableDeclaration.name.elements[index];
                if (ts.isBindingElement(element) && ts.isObjectBindingPattern(element.name) && element.name.elements) {
                  return element.name.elements.map(element => {
                    const identifier = (element.propertyName ?? element.name).getText();
                    return { identifier, specifier, pos: element.pos };
                  });
                }

                return { identifier: 'default', specifier, pos: element.pos };
              }

              // Pattern: import('side-effects')
              return { identifier: 'default', specifier, pos: node.arguments[0].pos };
            }
          }
        }

        return { specifier, identifier: 'default', pos: node.arguments[0].pos };
      }
    }
  }
);
