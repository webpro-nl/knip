import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';

export function createNanoSpawnVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  return {
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || node.callee.name !== 'spawn') return;
      const executable = node.arguments[0];
      if (!executable || !isStringLiteral(executable)) return;
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
    },
  };
}
