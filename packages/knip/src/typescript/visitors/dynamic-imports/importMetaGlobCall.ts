import ts from 'typescript';
import { isPropertyAccessCall } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

/**
 * Visitor for Vite's import.meta.glob* calls.
 *
 * Supported patterns:
 * - import.meta.globEager('./dir/*.ts') (Vite v2)
 * - import.meta.glob('./dir/*.ts') (Vite v3+)
 * - import.meta.glob(['./a/*.ts', './b/*.ts']) (Vite v3+)
 */
export default visit(
  () => true,
  node => {
    const isGlobCall =
      isPropertyAccessCall(node, 'import.meta.glob') || isPropertyAccessCall(node, 'import.meta.globEager');

    if (!isGlobCall) return;

    const [patternArg] = node.arguments;
    if (!patternArg) return;

    // Single pattern: import.meta.glob('./dir/*.ts')
    if (ts.isStringLiteralLike(patternArg)) {
      const specifier = patternArg.text;
      if (specifier) {
        return { specifier, identifier: undefined, pos: patternArg.pos };
      }
      return;
    }

    // Multiple patterns: import.meta.glob(['./a/*.ts', './b/*.ts'])
    if (ts.isArrayLiteralExpression(patternArg)) {
      const results = patternArg.elements
        .filter((el): el is ts.StringLiteralLike => ts.isStringLiteralLike(el))
        .map(el => ({ specifier: el.text, identifier: undefined, pos: el.pos }));

      if (results.length > 0) return results;
    }
  }
);
