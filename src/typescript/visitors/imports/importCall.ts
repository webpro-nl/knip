import ts from 'typescript';
import { isImportCall, isAccessExpression, isVariableDeclarationList, findDescendants } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isImportCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;

        // Pattern: import('specifier').then();
        if (isAccessExpression(node.parent)) {
          return { specifier, isDynamic: true };
        }

        let _ancestor = node.parent?.parent?.parent;

        // Pattern: (import('specifier')).identifier;
        if (_ancestor && isAccessExpression(_ancestor)) {
          return { specifier, isDynamic: true };
        }

        while (_ancestor) {
          if (_ancestor) {
            // Patterns:
            // const { identifier } = await import('specifier')
            // const [identifier, identifier] = await Promise.all[import('specifier'), import('specifier')];
            // Could be deferred to LS.findReferences but that won't stitch it back together properly
            if (isVariableDeclarationList(_ancestor)) {
              return findDescendants<ts.VariableDeclaration>(_ancestor, ts.isVariableDeclaration).flatMap(
                variableDeclaration => {
                  if (ts.isIdentifier(variableDeclaration.name)) {
                    return { identifier: 'default', specifier };
                  } else {
                    const binds = findDescendants<ts.BindingElement>(
                      variableDeclaration,
                      _node => ts.isBindingElement(_node) && ts.isIdentifier(_node.name)
                    );
                    return binds.flatMap(element => {
                      // TODO Duplicate imports added here when inside Promise.all array (harmless but could be optimized)
                      const symbol = element.propertyName?.getText() || element.name.getText();
                      return { identifier: symbol, specifier };
                    });
                  }
                }
              );
            }

            // Pattern:
            // const components = { identifier: defineComponent(() => import('specifier')) };
            if (ts.isPropertyAssignment(_ancestor)) {
              return { identifier: 'default', specifier };
            }
          }

          _ancestor = _ancestor.parent;
        }

        // Patterns:
        // import('side-effects')
        // const a = [import('side-effects')]
        return { specifier };
      }
    }
  }
);
