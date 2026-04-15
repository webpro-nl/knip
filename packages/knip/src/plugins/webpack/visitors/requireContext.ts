import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { _syncGlob } from '../../../util/glob.ts';
import { dirname, join, toRelative } from '../../../util/path.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/visitors/helpers.ts';

export function createRequireContextVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    CallExpression(node) {
      if (
        node.callee.type !== 'MemberExpression' ||
        node.callee.computed ||
        node.callee.object.type !== 'Identifier' ||
        node.callee.object.name !== 'require' ||
        node.callee.property.name !== 'context' ||
        node.arguments.length < 1 ||
        !isStringLiteral(node.arguments[0])
      )
        return;

      const dirArg = getStringValue(node.arguments[0])!;
      const arg1 = node.arguments[1];
      const recursive = !(arg1?.type === 'Literal' && 'value' in arg1 && arg1.value === false);
      const regexArg = node.arguments[2];
      const dir = dirname(ctx.filePath);
      const baseDir = join(dir, dirArg);
      const pattern = recursive ? '**/*' : '*';
      const files = _syncGlob({ patterns: [pattern], cwd: baseDir });
      const regex =
        regexArg && 'regex' in regexArg ? new RegExp(regexArg.regex.pattern, regexArg.regex.flags) : undefined;

      for (const f of files) {
        if (!regex || regex.test(`./${toRelative(f, baseDir)}`)) {
          ctx.addImport(f, node.arguments[0].start, IMPORT_FLAGS.ENTRY);
        }
      }
    },
  };
}
