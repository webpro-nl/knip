import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { _syncGlob } from '../../../util/glob.ts';
import { dirname, isAbsolute, join } from '../../../util/path.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/visitors/helpers.ts';

export function createImportMetaGlobVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    CallExpression(node) {
      if (
        node.callee.type !== 'MemberExpression' ||
        node.callee.computed ||
        node.callee.object.type !== 'MetaProperty' ||
        node.callee.property.name !== 'glob' ||
        node.arguments.length < 1
      )
        return;

      const arg = node.arguments[0];
      let patterns: string[] | undefined;
      if (isStringLiteral(arg)) {
        patterns = [getStringValue(arg)!];
      } else if (arg.type === 'ArrayExpression') {
        patterns = [];
        for (const e of arg.elements) {
          if (e && isStringLiteral(e)) patterns.push(getStringValue(e)!);
        }
      }

      if (!patterns?.length) return;

      const dir = dirname(ctx.filePath);
      const files = _syncGlob({ patterns, cwd: dir });

      for (const f of files) {
        ctx.addImport(isAbsolute(f) ? f : join(dir, f), arg.start, IMPORT_FLAGS.ENTRY);
      }
    },
  };
}
