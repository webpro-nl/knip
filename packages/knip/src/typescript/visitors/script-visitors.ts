import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';

export function createBunShellVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      const tag = node.tag;
      if (tag.type === 'Identifier' && tag.name === '$') {
        for (const q of node.quasi.quasis) {
          if (q.value.raw) ctx.addScript(q.value.raw);
        }
      }
    },
  };
}
