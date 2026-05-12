import type { ObjectExpression } from 'oxc-parser';
import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.ts';
import { clientToPackages } from '../helpers.ts';

const KNEX = 'knex';

export function createKnexClientVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  const defaultNames = new Set<string>();
  const namedNames = new Set<string>();

  const addClientPackages = (obj: ObjectExpression, pos: number) => {
    for (const prop of obj.properties) {
      if (prop.type !== 'Property' || prop.computed || prop.key.type !== 'Identifier') continue;
      if (prop.key.name !== 'client') continue;
      if (!isStringLiteral(prop.value)) return;
      const client = getStringValue(prop.value);
      if (!client) return;
      for (const pkg of clientToPackages(client)) {
        ctx.addImport(pkg, pos, IMPORT_FLAGS.NONE);
      }
      return;
    }
  };

  return {
    Program() {
      defaultNames.clear();
      namedNames.clear();
    },
    ImportDeclaration(node) {
      if (!isStringLiteral(node.source) || getStringValue(node.source) !== KNEX) return;
      for (const spec of node.specifiers ?? []) {
        if (spec.type === 'ImportDefaultSpecifier') {
          defaultNames.add(spec.local.name);
        } else if (spec.type === 'ImportSpecifier') {
          if (spec.imported.type === 'Identifier' && spec.imported.name === KNEX) {
            namedNames.add(spec.local.name);
          }
        }
      }
    },
    VariableDeclarator(node) {
      if (
        node.init?.type !== 'CallExpression' ||
        node.init.callee.type !== 'Identifier' ||
        node.init.callee.name !== 'require' ||
        !isStringLiteral(node.init.arguments[0]) ||
        getStringValue(node.init.arguments[0]) !== KNEX
      )
        return;
      if (node.id.type === 'Identifier') {
        defaultNames.add(node.id.name);
      } else if (node.id.type === 'ObjectPattern') {
        for (const prop of node.id.properties) {
          if (
            prop.type === 'Property' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === KNEX &&
            prop.value.type === 'Identifier'
          ) {
            namedNames.add(prop.value.name);
          }
        }
      }
    },
    CallExpression(node) {
      if (defaultNames.size === 0 && namedNames.size === 0) return;
      const arg = node.arguments[0];
      if (arg?.type !== 'ObjectExpression') return;

      const callee = node.callee;

      const isDirectCall =
        callee.type === 'Identifier' && (defaultNames.has(callee.name) || namedNames.has(callee.name));

      const isNamespaceCall =
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        defaultNames.has(callee.object.name) &&
        callee.property.type === 'Identifier' &&
        callee.property.name === KNEX;

      if (isDirectCall || isNamespaceCall) addClientPackages(arg, arg.start);
    },
  };
}
