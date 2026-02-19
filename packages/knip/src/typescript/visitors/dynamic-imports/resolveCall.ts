import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.ts';
import { isPropertyAccessCall } from '../../ast-helpers.ts';
import { importVisitor as visit } from '../index.ts';

export default visit(
  () => true,
  node => {
    if (isPropertyAccessCall(node, 'require.resolve') || isPropertyAccessCall(node, 'import.meta.resolve')) {
      // Pattern: require.resolve('specifier')
      // Pattern: import.meta.resolve('specifier')
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        if (specifier)
          return {
            specifier,
            identifier: undefined,
            pos: node.arguments[0].pos,
            modifiers: IMPORT_FLAGS.ENTRY,
            alias: undefined,
            namespace: undefined,
            symbol: undefined,
          };
      }
    }
  }
);
