import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.js';
import { isPropertyAccessCall } from '../../../typescript/ast-helpers.js';
import type { ImportVisitor } from '../../../typescript/visitors/index.js';
import { _syncGlob } from '../../../util/glob.js';
import { dirname, isAbsolute, join } from '../../../util/path.js';

export const requireContextCall: ImportVisitor = sourceFile => {
  return node => {
    if (!isPropertyAccessCall(node, 'require.context')) return;

    const [dirArg, recursiveArg, regExpArg] = node.arguments;
    if (!dirArg || !ts.isStringLiteralLike(dirArg)) return;

    const cwd = join(dirname(sourceFile.fileName), dirArg.text);
    const isRecursive = !recursiveArg || recursiveArg.kind !== ts.SyntaxKind.FalseKeyword;
    const pattern = isRecursive ? '**/*' : '*';
    const files = _syncGlob({ patterns: [pattern], cwd });

    const filter =
      regExpArg && ts.isRegularExpressionLiteral(regExpArg) ? regExpArg.text.match(/^\/(.+)\/([gimsuy]*)$/) : null;
    const matched = filter ? files.filter(file => new RegExp(filter[1], filter[2]).test(file)) : files;

    return matched.map(filePath => ({
      specifier: isAbsolute(filePath) ? filePath : join(cwd, filePath),
      identifier: undefined,
      pos: dirArg.pos,
      modifiers: IMPORT_FLAGS.ENTRY,
      alias: undefined,
      namespace: undefined,
      symbol: undefined,
    }));
  };
};
