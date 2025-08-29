import ts from 'typescript';
import { requireContextToGlob } from '../../../util/glob-imports.js';
import { isPropertyAccessCall } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

const parseRegExpLiteral = (node: ts.RegularExpressionLiteral | undefined): RegExp | undefined => {
  if (!node) return undefined;

  // TypeScript AST gives us the raw regex string
  const raw = node.getText(); // e.g. `/\.js$/gi`

  // Extract pattern and flags from `/pattern/flags` format
  const match = raw.match(/^\/(.*)\/([gimsuy]*)$/);
  try {
    if (match) return new RegExp(match[1], match[2]);
    return new RegExp(raw);
  } catch {
    return undefined;
  }
};

export default visit(
  () => true,
  node => {
    // Pattern: require.context(directory, useSubdirectories?, regExp?)
    // https://webpack.js.org/guides/dependency-management/#requirecontext
    if (isPropertyAccessCall(node, 'require.context')) {
      const [directoryArg, recursiveArg, regexArg] = node.arguments;

      if (directoryArg && ts.isStringLiteralLike(directoryArg)) {
        const directory = directoryArg.text;

        // Webpack defaults to true for `useSubdirectories`
        let useSubdirectories = true;
        if (recursiveArg) {
          if (recursiveArg.kind === ts.SyntaxKind.FalseKeyword) useSubdirectories = false;
          if (recursiveArg.kind === ts.SyntaxKind.TrueKeyword) useSubdirectories = true;
        }

        const regExp = regexArg && ts.isRegularExpressionLiteral(regexArg) ? parseRegExpLiteral(regexArg) : undefined;

        // If regex is not provided or failed to parse, default to match-all
        const effectiveRegex = regExp ?? /^\.\/.*$/;
        const specifier = requireContextToGlob(directory, useSubdirectories, effectiveRegex);

        // Let the normal addImport flow resolve this glob pattern to files
        return { specifier, identifier: undefined, pos: directoryArg.pos };
      }
    }
  }
);
