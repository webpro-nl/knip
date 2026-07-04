import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';

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

      ctx.addImportGlob(patterns);
    },
  };
}
