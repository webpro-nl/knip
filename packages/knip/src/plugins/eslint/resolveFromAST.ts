import type { Program } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { type Input, toDeferResolve } from '../../util/input.ts';
import { findProperty } from '../../typescript/ast-helpers.ts';
import { isInternal } from '../../util/path.ts';

export const getInputsFromFlatConfigAST = (program: Program): Input[] => {
  const inputs: Input[] = [];

  const visitor = new Visitor({
    ObjectExpression(node) {
      const settingsNode = findProperty(node, 'settings');
      if (!settingsNode || settingsNode.type !== 'ObjectExpression') return;

      for (const prop of settingsNode.properties ?? []) {
        if (prop.type !== 'Property') continue;
        const key = prop.key?.name ?? prop.key?.value;
        if (key === 'import/resolver' || key === 'import/parsers') {
          if (prop.value?.type === 'ObjectExpression') {
            for (const p of prop.value.properties ?? []) {
              if (p.type !== 'Property') continue;
              const resolver = p.key?.name ?? p.key?.value;
              if (resolver && resolver !== 'node' && !isInternal(resolver)) {
                const dep = key === 'import/resolver' ? `eslint-import-resolver-${resolver}` : resolver;
                inputs.push(toDeferResolve(dep, { optional: true }));
              }
            }
          } else if (
            prop.value?.type === 'StringLiteral' ||
            (prop.value?.type === 'Literal' && typeof prop.value.value === 'string')
          ) {
            const resolver = prop.value.value;
            if (resolver && resolver !== 'node' && !isInternal(resolver)) {
              const dep = key === 'import/resolver' ? `eslint-import-resolver-${resolver}` : resolver;
              inputs.push(toDeferResolve(dep, { optional: true }));
            }
          }
        }
      }
    },
  });
  visitor.visit(program);

  inputs.push(toDeferResolve('eslint-import-resolver-typescript', { optional: true }));

  return inputs;
};
