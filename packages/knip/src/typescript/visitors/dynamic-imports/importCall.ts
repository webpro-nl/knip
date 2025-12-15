import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.js';
import {
  findAncestor,
  findDescendants,
  getAccessedIdentifiers,
  getThenBindings,
  isAccessExpression,
  isImportCall,
  isInOpaqueExpression,
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
        const modifiers = IMPORT_FLAGS.NONE;

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
                if (ts.isCallExpression(callExpression)) {
                  const accessed = getThenBindings(callExpression);
                  if (accessed && accessed.length > 0) {
                    // Pattern: import('specifier').then(module => module.identifier);
                    // Pattern: import('specifier').then({ identifier } => identifier);
                    return accessed.map(acc => ({ ...acc, specifier, modifiers }));
                  }
                }
                // Pattern: import('specifier').then(id => id)
                return { identifier: 'default', specifier, pos, modifiers };
              }

              // Pattern: (await import('./prop-access')).propAccess;
              if (identifier !== 'catch') return { identifier, specifier, pos, modifiers };
            }

            if (
              ts.isElementAccessExpression(accessExpression) &&
              ts.isStringLiteral(accessExpression.argumentExpression)
            ) {
              const name = stripQuotes(accessExpression.argumentExpression.text);
              const pos = accessExpression.argumentExpression.pos;
              const identifier = name;
              // Pattern: (await import('specifier'))['identifier']
              return { identifier, specifier, pos, modifiers };
            }
          }

          const variableDeclaration =
            accessExpression &&
            ts.isPropertyAccessExpression(accessExpression) &&
            accessExpression.name &&
            accessExpression.name.escapedText === 'catch'
              ? node.parent.parent.parent.parent
              : ts.isVariableDeclaration(node.parent)
                ? node.parent
                : node.parent.parent;
          if (
            ts.isVariableDeclaration(variableDeclaration) &&
            ts.isVariableDeclarationList(variableDeclaration.parent)
          ) {
            const isTLA = isTopLevel(variableDeclaration.parent);
            if (ts.isIdentifier(variableDeclaration.name)) {
              // Pattern: const identifier = await import('specifier');
              // Pattern: const promise = import('specifier'); const { identifier: alias } = await promise;
              const alias = String(variableDeclaration.name.escapedText);
              const symbol = getSymbol(variableDeclaration, isTLA);
              // @ts-expect-error ts.isFunctionBody
              const scope: ts.Node = findAncestor(variableDeclaration, ts.isFunctionBody) || node.getSourceFile();
              const accessed = getAccessedIdentifiers(alias, scope);
              if (accessed.length > 0) {
                return accessed.map(acc => ({
                  identifier: acc.identifier,
                  alias,
                  symbol,
                  specifier,
                  pos: acc.pos,
                  modifiers,
                }));
              }
              return { identifier: 'default', alias, symbol, specifier, pos: node.arguments[0].pos, modifiers };
            }
            const bindings = findDescendants<ts.BindingElement>(variableDeclaration, ts.isBindingElement);
            if (bindings.length > 0) {
              // Pattern: const { identifier } = await import('specifier');
              return bindings.map(element => {
                const identifier = (element.propertyName ?? element.name).getText();
                const alias = element.propertyName ? element.name.getText() : undefined;
                const symbol = getSymbol(element, isTLA);
                return { identifier, alias, symbol, specifier, pos: element.name.getStart(), modifiers };
              });
            }
            // Pattern: import('specifier')
            return {
              identifier: undefined,
              specifier,
              pos: node.arguments[0].pos,
              modifiers: IMPORT_FLAGS.SIDE_EFFECTS,
            };
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
                  return { identifier, alias, symbol, specifier, pos: element.getStart(), modifiers };
                });
              }

              if (!ts.isOmittedExpression(element) && ts.isIdentifier(element.name)) {
                // Pattern: const [a, b] = await Promise.all([import('A'), import('B')]);
                const alias = String(element.name.escapedText);
                const symbol = getSymbol(element, isTL);
                return { identifier: 'default', symbol, alias, specifier, pos: element.getStart(), modifiers };
              }

              return { identifier: 'default', specifier, pos: element.getStart(), modifiers };
            }
          }

          // Pattern: import('side-effects')
          return {
            identifier: undefined,
            specifier,
            pos: node.arguments[0].pos,
            modifiers: isInOpaqueExpression(node) ? IMPORT_FLAGS.OPAQUE : IMPORT_FLAGS.SIDE_EFFECTS,
          };
        }

        // Fallback, seems to never happen though
        return { specifier, identifier: 'default', pos: node.arguments[0].pos, modifiers };
      }
    }
  }
);
