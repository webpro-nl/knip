import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';

export function createBunShellVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      const tag = node.tag;
      if (tag.type === 'Identifier' && tag.name === '$') {
        const firstQuasiIsEmpty = !node.quasi.quasis[0]?.value.raw;
        for (const [index, q] of node.quasi.quasis.entries()) {
          const script = q.value.raw;
          if (!script) continue;
          if (index > 0 && firstQuasiIsEmpty && !/^\s*[;&|]/.test(script)) continue;
          ctx.addScript(script);
        }
      }
    },
  };
}
