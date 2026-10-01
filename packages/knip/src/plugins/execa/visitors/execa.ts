import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getSafeScriptFromArgs, getScriptFromArg, getScriptFromTemplate } from '../../../typescript/ast-nodes.ts';

const tags = new Set(['$', '$sync']);
const methods = new Set(['execa', 'execaSync', 'execaCommand', 'execaCommandSync', 'execaNode', '$sync']);

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
      const isNode = tagName === 'execaNode';
      if (!isNode && !(tagName && tags.has(tagName))) return;
      const script = getScriptFromTemplate(node.quasi);
      if (script) ctx.addScript(isNode ? `node ${script}` : script);
    },
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !methods.has(node.callee.name)) return;
      const fnName = node.callee.name;
      if (fnName === 'execaNode') {
        const script = getSafeScriptFromArgs(node.arguments[0], node.arguments[1]);
        if (script) ctx.addScript(`node ${script}`);
      } else if (fnName.startsWith('execaCommand')) {
        const script = getScriptFromArg(node.arguments[0]);
        if (script) ctx.addScript(script);
      } else {
        const script = getSafeScriptFromArgs(node.arguments[0], node.arguments[1]);
        if (script) ctx.addScript(script);
      }
    },
  };
}
