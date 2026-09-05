import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { findProperty } from '../../../typescript/ast-helpers.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';

const RAW_QUERY_RE = /(\?|&)raw(?:&|$)/;

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

      const options = node.arguments[1];
      if (options?.type === 'ObjectExpression') {
        const query = getStringValue(findProperty(options, 'query'));
        if (getStringValue(findProperty(options, 'as')) === 'raw' || (query && RAW_QUERY_RE.test(query))) return;
      }

      ctx.addImportGlob(patterns);
    },
  };
}
