import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.ts';
import { isPropertyAccessCall } from '../../../typescript/ast-helpers.ts';
import type { ImportVisitor } from '../../../typescript/visitors/index.ts';
import { _syncGlob } from '../../../util/glob.ts';
import { dirname, isAbsolute, join } from '../../../util/path.ts';

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
    const re = filter ? new RegExp(filter[1], filter[2]) : null;
    const matched = re ? files.filter(file => re.test(`./${file}`)) : files;

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
