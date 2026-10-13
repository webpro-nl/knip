import { existsSync } from 'node:fs';
import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { isShadowed } from '../../../typescript/visitors/walk.ts';
import { _syncGlob } from '../../../util/glob.ts';
import { dirname, extname, isInternal, join } from '../../../util/path.ts';

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
  const mockLookups: { specifier: string; pos: number }[] = [];
  let manualMocks: Map<string, string> | undefined;

  const getManualMock = (specifier: string) => {
    if (isInternal(specifier)) return;
    if (!manualMocks) {
      manualMocks = new Map();
      let cwd = dirname(ctx.filePath);
      while (!existsSync(join(cwd, 'package.json'))) {
        const parent = dirname(cwd);
        if (parent === cwd) return;
        cwd = parent;
      }
      for (const filePath of _syncGlob({
        cwd,
        patterns: ['**/__mocks__/**/*.[jt]s?(x)', '!**/node_modules/**'],
      })) {
        const mockPath = filePath.slice(filePath.indexOf('/__mocks__/') + '/__mocks__/'.length);
        manualMocks.set(mockPath.slice(0, -extname(mockPath).length), filePath);
      }
    }
    return manualMocks.get(specifier);
  };

  return {
    Program(node) {
      jestNames.clear();
      virtualMocks.clear();
      mockLookups.length = 0;
      manualMocks = undefined;
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
            property.key.type === 'Identifier' &&
            property.key.name === 'virtual' &&
            property.value.type === 'Literal' &&
            property.value.value === true
          ) {
            virtualMocks.add(specifier);
            return;
          }
        }
      }

      if (method === 'requireMock') {
        mockLookups.push({ specifier, pos: argument.start });
        return;
      }

      const flags = method === 'requireActual' ? IMPORT_FLAGS.OPAQUE : IMPORT_FLAGS.SIDE_EFFECTS;
      const mock = method === 'mock' || method === 'doMock' ? getManualMock(specifier) : undefined;
      ctx.addImport(mock ?? specifier, argument.start, flags);
    },
    'Program:exit'() {
      for (const { specifier, pos } of mockLookups) {
        if (!virtualMocks.has(specifier))
          ctx.addImport(getManualMock(specifier) ?? specifier, pos, IMPORT_FLAGS.SIDE_EFFECTS);
      }
    },
  };
}
