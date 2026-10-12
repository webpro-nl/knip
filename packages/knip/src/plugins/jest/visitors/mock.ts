import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { isShadowed } from '../../../typescript/visitors/walk.ts';

const mockMethods = new Set(['mock', 'doMock', 'requireActual', 'requireMock', 'createMockFromModule']);

export function createJestMockVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const jestNames = new Set<string>();

  return {
    Program(node) {
      jestNames.clear();
      jestNames.add('jest');
      for (const statement of node.body) {
        const declaration =
          statement.type === 'ExportNamedDeclaration' && statement.declaration ? statement.declaration : statement;
        if (declaration.type === 'VariableDeclaration') {
          for (const declarator of declaration.declarations) {
            if (declarator.id.type === 'Identifier' && declarator.id.name === 'jest') jestNames.delete('jest');
          }
        } else if (
          (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') &&
          declaration.id?.name === 'jest'
        ) {
          jestNames.delete('jest');
        }
        if (statement.type === 'ImportDeclaration') {
          for (const specifier of statement.specifiers ?? []) {
            if (specifier.local.name === 'jest') jestNames.delete('jest');
          }
        }
        if (
          statement.type !== 'ImportDeclaration' ||
          !isStringLiteral(statement.source) ||
          getStringValue(statement.source) !== '@jest/globals'
        )
          continue;
        for (const specifier of statement.specifiers ?? []) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'jest'
          ) {
            jestNames.add(specifier.local.name);
          }
        }
      }
    },
    CallExpression(node) {
      const argument = node.arguments[0];
      const callee = node.callee;
      if (
        !isStringLiteral(argument) ||
        callee.type !== 'MemberExpression' ||
        callee.computed ||
        callee.object.type !== 'Identifier' ||
        !jestNames.has(callee.object.name) ||
        isShadowed(callee.object.name, callee.object.start) ||
        callee.property.type !== 'Identifier' ||
        !mockMethods.has(callee.property.name)
      )
        return;

      const options = node.arguments[2];
      if (
        (callee.property.name === 'mock' || callee.property.name === 'doMock') &&
        options?.type === 'ObjectExpression'
      ) {
        for (const property of options.properties) {
          if (
            property.type === 'Property' &&
            !property.computed &&
            property.key.type === 'Identifier' &&
            property.key.name === 'virtual' &&
            property.value.type === 'Literal' &&
            property.value.value === true
          )
            return;
        }
      }

      const flags = callee.property.name === 'requireActual' ? IMPORT_FLAGS.OPAQUE : IMPORT_FLAGS.SIDE_EFFECTS;
      ctx.addImport(getStringValue(argument)!, argument.start, flags);
    },
  };
}
