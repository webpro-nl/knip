import type { Expression, Program, SpreadElement } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { type Input, toDeferResolve } from '../../util/input.ts';
import { findProperty, getPropertyKey } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isInternal } from '../../util/path.ts';
import { type ImportSettingKind, importSettingKinds } from './helpers.ts';

export const getInputsFromSettingsAST = (program: Program): Input[] => {
  const inputs: Input[] = [];

  const addResolver = (kind: ImportSettingKind, resolver: string | undefined) => {
    if (!resolver || resolver === 'node' || isInternal(resolver)) return;
    const dep = kind === 'resolver' ? `eslint-import-resolver-${resolver}` : resolver;
    inputs.push(toDeferResolve(dep, { optional: true }));
  };

  const addResolvers = (kind: ImportSettingKind, node: Expression | SpreadElement | null) => {
    if (node?.type === 'ArrayExpression') {
      for (const element of node.elements) addResolvers(kind, element);
    } else if (node?.type === 'ObjectExpression') {
      for (const prop of node.properties) {
        if (prop.type === 'Property') addResolver(kind, getPropertyKey(prop));
      }
    } else {
      addResolver(kind, getStringValue(node));
    }
  };

  const visitor = new Visitor({
    ObjectExpression(node) {
      const settingsNode = findProperty(node, 'settings');
      if (!settingsNode || settingsNode.type !== 'ObjectExpression') return;

      for (const prop of settingsNode.properties ?? []) {
        if (prop.type !== 'Property') continue;
        const key = getPropertyKey(prop);
        const kind = key && importSettingKinds.get(key);
        if (kind) addResolvers(kind, prop.value);
      }
    },
  });
  visitor.visit(program);

  return inputs;
};

export const getInputsFromFlatConfigAST = (program: Program): Input[] => [
  ...getInputsFromSettingsAST(program),
  toDeferResolve('eslint-import-resolver-typescript', { optional: true }),
];
