import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';

export function createZxVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      if (!ctx.sourceText.startsWith('#!/usr/bin/env zx')) return;
      if (node.tag.type === 'Identifier' && node.tag.name === '$') {
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
