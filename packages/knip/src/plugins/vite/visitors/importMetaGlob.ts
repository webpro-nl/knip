import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.ts';
import { isPropertyAccessCall } from '../../../typescript/ast-helpers.ts';
import type { ImportVisitor } from '../../../typescript/visitors/index.ts';
import { _syncGlob } from '../../../util/glob.ts';
import { dirname, isAbsolute, join } from '../../../util/path.ts';

export const importMetaGlobCall: ImportVisitor = sourceFile => {
  return node => {
    if (!isPropertyAccessCall(node, 'import.meta.glob')) return;

    const arg = node.arguments[0];
    if (!arg) return;

    const dir = dirname(sourceFile.fileName);
    const patterns = ts.isStringLiteralLike(arg)
      ? [arg.text]
      : ts.isArrayLiteralExpression(arg)
        ? arg.elements.filter(ts.isStringLiteralLike).map(e => e.text)
        : undefined;

    if (!patterns?.length) return;

    const files = _syncGlob({ patterns, cwd: dir });

    return files.map(filePath => ({
      specifier: isAbsolute(filePath) ? filePath : join(dir, filePath),
      identifier: undefined,
      pos: arg.pos,
      modifiers: IMPORT_FLAGS.ENTRY,
      alias: undefined,
      namespace: undefined,
      symbol: undefined,
    }));
  };
};
