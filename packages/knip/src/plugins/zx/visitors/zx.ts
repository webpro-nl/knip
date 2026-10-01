import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getScriptFromTemplate } from '../../../typescript/ast-nodes.ts';

export function createZxVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    TaggedTemplateExpression(node) {
      if (!ctx.sourceText.startsWith('#!/usr/bin/env zx')) return;
      if (node.tag.type === 'Identifier' && node.tag.name === '$') {
        const script = getScriptFromTemplate(node.quasi);
        if (script) ctx.addScript(script);
      }
    },
  };
}
