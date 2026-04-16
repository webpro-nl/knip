import type { ObjectExpression } from 'oxc-parser';
import { IMPORT_FLAGS } from '../../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../../types/config.ts';
import { getStringValue, isStringLiteral } from '../../../typescript/visitors/helpers.ts';
import { isInternal } from '../../../util/path.ts';

const PINO = 'pino';

export function createPinoTransportVisitor(ctx: PluginVisitorContext): PluginVisitorObject {
  let pinoName: string | undefined;
  let transportName: string | undefined;

  const addTarget = (specifier: string, pos: number) => {
    ctx.addImport(specifier, pos, isInternal(specifier) ? IMPORT_FLAGS.ENTRY : IMPORT_FLAGS.NONE);
  };

  const collectTargets = (obj: ObjectExpression) => {
    for (const prop of obj.properties) {
      if (prop.type !== 'Property' || prop.computed || prop.key.type !== 'Identifier') continue;
      const key = prop.key.name;
      if (key === 'target' && isStringLiteral(prop.value)) {
        addTarget(getStringValue(prop.value)!, prop.value.start);
      } else if ((key === 'targets' || key === 'pipeline') && prop.value.type === 'ArrayExpression') {
        for (const el of prop.value.elements) {
          if (el?.type === 'ObjectExpression') collectTargets(el);
        }
      }
    }
  };

  return {
    Program() {
      pinoName = undefined;
      transportName = undefined;
    },
    ImportDeclaration(node) {
      if (!isStringLiteral(node.source) || getStringValue(node.source) !== PINO) return;
      for (const spec of node.specifiers ?? []) {
        if (spec.type === 'ImportDefaultSpecifier') {
          pinoName = spec.local.name;
        } else if (spec.type === 'ImportSpecifier') {
          if (spec.imported.type === 'Identifier' && spec.imported.name === 'transport') {
            transportName = spec.local.name;
          }
        }
      }
    },
    VariableDeclarator(node) {
      if (
        node.id.type !== 'Identifier' ||
        node.init?.type !== 'CallExpression' ||
        node.init.callee.type !== 'Identifier' ||
        node.init.callee.name !== 'require' ||
        !isStringLiteral(node.init.arguments[0]) ||
        getStringValue(node.init.arguments[0]) !== PINO
      )
        return;
      pinoName ??= node.id.name;
    },
    CallExpression(node) {
      if (!pinoName && !transportName) return;
      const callee = node.callee;
      const arg = node.arguments[0];
      if (arg?.type !== 'ObjectExpression') return;

      const isPinoTransport =
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.object.name === pinoName &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'transport';

      const isNamedTransport =
        callee.type === 'Identifier' && transportName !== undefined && callee.name === transportName;

      if (isPinoTransport || isNamedTransport) {
        collectTargets(arg);
        return;
      }

      if (callee.type === 'Identifier' && callee.name === pinoName) {
        for (const prop of arg.properties) {
          if (
            prop.type === 'Property' &&
            !prop.computed &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'transport' &&
            prop.value.type === 'ObjectExpression'
          ) {
            collectTargets(prop.value);
          }
        }
      }
    },
  };
}
