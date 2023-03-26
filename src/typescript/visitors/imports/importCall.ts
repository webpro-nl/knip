import ts from 'typescript';
import {
  isImportCall,
  isAccessExpression,
  getAccessExpressionName,
  isVariableDeclarationList,
  findDescendants,
} from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isImportCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;

        // Try some patterns that require node.parent first for more specific import identifiers
        let _node = node.parent;
        while (_node) {
          if (_node.parent && ts.isCallExpression(_node.parent)) {
            // Pattern: e.g. inside a call expression such as Promise.all()
            return { specifier, identifier: 'default' };
          }

          if (isAccessExpression(_node)) {
            // Patterns:
            // import('specifier').then()
            // (import('specifier')).identifier
            // (import('specifier'))['identifier']
            const identifier = getAccessExpressionName(_node);
            const isPromiseLike = identifier === 'then';
            const symbol = isPromiseLike ? 'default' : identifier;
            return { identifier: symbol, specifier };
          }

          if (isVariableDeclarationList(_node)) {
            // Pattern: const { identifier } = import('specifier')
            return findDescendants<ts.VariableDeclaration>(_node, ts.isVariableDeclaration).flatMap(
              variableDeclaration => {
                if (ts.isIdentifier(variableDeclaration.name)) {
                  return { identifier: 'default', specifier };
                } else {
                  const binds = findDescendants<ts.BindingElement>(variableDeclaration, _node =>
                    ts.isBindingElement(_node)
                  );
                  return binds.flatMap(element => {
                    const symbol = element.propertyName?.getText() || element.name.getText();
                    return { identifier: symbol, specifier };
                  });
                }
              }
            );
          }

          _node = _node.parent;
        }

        // Patterns:
        // import('side-effects')
        // const a = [import('side-effects')]
        return { specifier };
      }
    }
  }
);
