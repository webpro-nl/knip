import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { isShadowed } from '../../../typescript/visitors/walk.ts';

export function createVitestMockVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const viNames = new Set<string>();

  return {
    Program(node) {
      viNames.clear();
      for (const statement of node.body) {
        if (
          statement.type !== 'ImportDeclaration' ||
          !isStringLiteral(statement.source) ||
          getStringValue(statement.source) !== 'vitest'
        )
          continue;
        for (const specifier of statement.specifiers ?? []) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'vi'
          ) {
            viNames.add(specifier.local.name);
          }
        }
      }
    },
    CallExpression(node) {
      const argument = node.arguments[0];
      const factory = node.arguments[1];
      const factoryBody =
        factory?.type === 'ArrowFunctionExpression' &&
        factory.body.type === 'ParenthesizedExpression' &&
        factory.body.expression.type === 'ObjectExpression'
          ? factory.body.expression
          : undefined;
      if (
        argument?.type !== 'ImportExpression' ||
        !isStringLiteral(argument.source) ||
        factory?.type !== 'ArrowFunctionExpression' ||
        !factoryBody ||
        factory.async ||
        factory.params.length > 0 ||
        factoryBody.properties.some(property => property.type === 'SpreadElement') ||
        node.callee.type !== 'MemberExpression' ||
        node.callee.computed ||
        node.callee.object.type !== 'Identifier' ||
        !viNames.has(node.callee.object.name) ||
        isShadowed(node.callee.object.name, node.callee.object.start) ||
        node.callee.property.type !== 'Identifier' ||
        node.callee.property.name !== 'mock'
      )
        return;

      ctx.markImportExpressionHandled(argument.start);
      ctx.addImport(getStringValue(argument.source)!, argument.source.start, IMPORT_FLAGS.SIDE_EFFECTS);
    },
  };
}
