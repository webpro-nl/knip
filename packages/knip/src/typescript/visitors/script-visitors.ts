import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';
import { getScriptFromTemplate } from '../ast-nodes.ts';

export function createBunShellVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      const tag = node.tag;
      if (tag.type === 'Identifier' && tag.name === '$') {
        const script = getScriptFromTemplate(node.quasi);
        if (script) ctx.addScript(script);
      }
    },
  };
}
