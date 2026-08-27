import type { ImportDeclaration, VariableDeclarator } from 'oxc-parser';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { findProperty, getPropertyKey } from '../../../typescript/ast-helpers.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';

const FS_PROMISES = new Set(['node:fs/promises', 'fs/promises']);

export function createFsPromisesGlobVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const globNames = new Set<string>();
  const namespaceNames = new Set<string>();

  return {
    Program() {
      globNames.clear();
      namespaceNames.clear();
    },
    ImportDeclaration(node: ImportDeclaration) {
      if (!FS_PROMISES.has(node.source.value)) return;
      for (const specifier of node.specifiers ?? []) {
        if (specifier.type === 'ImportNamespaceSpecifier') {
          namespaceNames.add(specifier.local.name);
        } else if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          specifier.imported.name === 'glob'
        ) {
          globNames.add(specifier.local.name);
        }
      }
    },
    VariableDeclarator(node: VariableDeclarator) {
      if (
        node.init?.type !== 'CallExpression' ||
        node.init.callee.type !== 'Identifier' ||
        node.init.callee.name !== 'require' ||
        !isStringLiteral(node.init.arguments[0]) ||
        !FS_PROMISES.has(getStringValue(node.init.arguments[0])!)
      )
        return;

      if (node.id.type === 'Identifier') {
        namespaceNames.add(node.id.name);
      } else if (node.id.type === 'ObjectPattern') {
        for (const property of node.id.properties) {
          if (
            property.type === 'Property' &&
            getPropertyKey(property) === 'glob' &&
            property.value.type === 'Identifier'
          ) {
            globNames.add(property.value.name);
          }
        }
      }
    },
    CallExpression(node) {
      let isGlobCall = node.callee.type === 'Identifier' && globNames.has(node.callee.name);
      if (
        !isGlobCall &&
        node.callee.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.object.type === 'Identifier' &&
        namespaceNames.has(node.callee.object.name) &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'glob'
      ) {
        isGlobCall = true;
      }
      if (!isGlobCall) return;

      const arg = node.arguments[0];
      if (!arg) return;
      let patterns: string[] | undefined;
      if (isStringLiteral(arg)) {
        patterns = [getStringValue(arg)!];
      } else if (arg.type === 'ArrayExpression') {
        patterns = [];
        for (const element of arg.elements) {
          if (!element || !isStringLiteral(element)) return;
          patterns.push(getStringValue(element)!);
        }
      }
      if (!patterns?.length) return;

      const cwdNode = findProperty(node.arguments[1], 'cwd');
      if (cwdNode && !isStringLiteral(cwdNode)) return;
      const cwd = cwdNode ? getStringValue(cwdNode) : undefined;
      ctx.addImportGlob(patterns, cwd === undefined ? undefined : { base: cwd });
    },
  };
}
