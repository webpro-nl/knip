import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { isShadowed } from '../../../typescript/visitors/walk.ts';

export function createImportSyncVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const names = new Set<string>();

  return {
    Program(node) {
      names.clear();
      for (const statement of node.body) {
        if (statement.type !== 'ImportDeclaration' || getStringValue(statement.source) !== '@embroider/macros')
          continue;
        for (const specifier of statement.specifiers ?? []) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'importSync'
          ) {
            names.add(specifier.local.name);
          }
        }
      }
    },
    CallExpression(node) {
      const argument = node.arguments[0];
      if (
        names.size === 0 ||
        node.callee.type !== 'Identifier' ||
        !names.has(node.callee.name) ||
        isShadowed(node.callee.name, node.callee.start) ||
        !isStringLiteral(argument)
      )
        return;
      ctx.addImport(getStringValue(argument)!, argument.start, IMPORT_FLAGS.OPAQUE);
    },
  };
}
