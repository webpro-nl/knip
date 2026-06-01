import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getSafeScriptFromArgs, getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';

const tags = new Set(['$', '$sync']);
const methods = new Set(['execa', 'execaSync', 'execaCommand', 'execaCommandSync', '$sync']);

export function createExecaVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      const tag = node.tag;
      const tagName =
        tag.type === 'Identifier'
          ? tag.name
          : tag.type === 'CallExpression' && tag.callee.type === 'Identifier'
            ? tag.callee.name
            : undefined;
      if (tagName && tags.has(tagName)) {
        for (const q of node.quasi.quasis) {
          if (q.value.raw) ctx.addScript(q.value.raw);
        }
      }
    },
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !methods.has(node.callee.name)) return;
      const fnName = node.callee.name;
      if (fnName.startsWith('execaCommand')) {
        if (node.arguments[0] && isStringLiteral(node.arguments[0])) {
          const val = getStringValue(node.arguments[0]);
          if (val) ctx.addScript(val);
        }
      } else {
        const script = getSafeScriptFromArgs(node.arguments[0], node.arguments[1]);
        if (script) ctx.addScript(script);
      }
    },
  };
}
