import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getSafeScriptFromArgs } from '../../../typescript/ast-nodes.ts';

export function createNanoSpawnVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || node.callee.name !== 'spawn') return;
      const script = getSafeScriptFromArgs(node.arguments[0], node.arguments[1]);
      if (script) ctx.addScript(script);
    },
  };
}
