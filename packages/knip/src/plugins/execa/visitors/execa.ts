import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/visitors/helpers.ts';

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
        const executable = node.arguments[0];
        if (executable && isStringLiteral(executable)) {
          const executableStr = getStringValue(executable)!;
          const args = node.arguments[1];
          if (args?.type === 'ArrayExpression') {
            const argStrings: string[] = [];
            for (const a of args.elements) {
              if (a && isStringLiteral(a)) argStrings.push(getStringValue(a)!);
            }
            ctx.addScript([executableStr, ...argStrings].join(' '));
          } else {
            ctx.addScript(executableStr);
          }
        }
      }
    },
  };
}
