import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getPropertyKey } from '../../../typescript/ast-helpers.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { isShadowed } from '../../../typescript/visitors/walk.ts';

const mockMethods = new Set([
  'mock',
  'doMock',
  'requireActual',
  'requireMock',
  'createMockFromModule',
  'unmock',
  'dontMock',
  'deepUnmock',
  'setMock',
  'unstable_mockModule',
  'unstable_unmockModule',
]);

export function createJestMockVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const jestNames = new Set<string>();
  const virtualMocks = new Set<string>();
  const virtualEsmMocks = new Set<string>();
  const mockLookups: { specifier: string; pos: number; isEsm: boolean }[] = [];

  return {
    Program(node) {
      jestNames.clear();
      virtualMocks.clear();
      virtualEsmMocks.clear();
      mockLookups.length = 0;
      jestNames.add('jest');
      for (const statement of node.body) {
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

      const specifier = getStringValue(argument)!;
      const method = callee.property.name;
      const options = node.arguments[2];
      if (
        (method === 'mock' || method === 'doMock' || method === 'unstable_mockModule') &&
        options?.type === 'ObjectExpression'
      ) {
        for (const property of options.properties) {
          if (
            property.type === 'Property' &&
            !property.computed &&
            getPropertyKey(property) === 'virtual' &&
            property.value.type === 'Literal' &&
            property.value.value === true
          ) {
            (method === 'unstable_mockModule' ? virtualEsmMocks : virtualMocks).add(specifier);
            return;
          }
        }
      }

      if (method === 'requireActual' || method === 'createMockFromModule') {
        const flags = method === 'requireActual' ? IMPORT_FLAGS.OPAQUE : IMPORT_FLAGS.SIDE_EFFECTS;
        ctx.addImport(specifier, argument.start, flags);
        return;
      }

      mockLookups.push({
        specifier,
        pos: argument.start,
        isEsm: method === 'unstable_mockModule' || method === 'unstable_unmockModule',
      });
    },
    'Program:exit'() {
      for (const { specifier, pos, isEsm } of mockLookups) {
        if ((isEsm ? virtualEsmMocks : virtualMocks).has(specifier)) continue;
        ctx.addImport(specifier, pos, IMPORT_FLAGS.SIDE_EFFECTS);
      }
    },
  };
}
