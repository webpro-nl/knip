import type { Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { type Input, toDeferResolve } from '../../util/input.ts';
import { findProperty, getPropertyKey } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isInternal } from '../../util/path.ts';

export const getInputsFromFlatConfigAST = (program: Program): Input[] => {
  const inputs: Input[] = [];

  const addResolver = (key: string, resolver: string | undefined) => {
    if (!resolver || resolver === 'node' || isInternal(resolver)) return;
    const dep = key === 'import/resolver' ? `eslint-import-resolver-${resolver}` : resolver;
    inputs.push(toDeferResolve(dep, { optional: true }));
  };

  const visitor = new Visitor({
    ObjectExpression(node) {
      const settingsNode = findProperty(node, 'settings');
      if (!settingsNode || settingsNode.type !== 'ObjectExpression') return;

      for (const prop of settingsNode.properties ?? []) {
        if (prop.type !== 'Property') continue;
        const key = getPropertyKey(prop);
        if (key !== 'import/resolver' && key !== 'import/parsers') continue;
        if (prop.value?.type === 'ObjectExpression') {
          for (const p of prop.value.properties ?? []) {
            if (p.type === 'Property') addResolver(key, getPropertyKey(p));
          }
        } else {
          addResolver(key, getStringValue(prop.value));
        }
      }
    },
  });
  visitor.visit(program);

  inputs.push(toDeferResolve('eslint-import-resolver-typescript', { optional: true }));

  return inputs;
};
