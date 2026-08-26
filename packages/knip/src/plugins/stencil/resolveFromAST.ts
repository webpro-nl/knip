import { type ObjectExpression, Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { collectFirstPropertyValue, collectPropertyValues, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toConfig, toEntry, toProductionEntry } from '../../util/input.ts';

export const entry = ['**/*.spec.{ts,tsx}', '**/*.e2e.{ts,tsx}'];

export const resolveFromAST: ResolveFromAST = program => {
  const inputs: Input[] = [];

  const srcDir = collectFirstPropertyValue(program, 'srcDir') ?? 'src';
  inputs.push(toProductionEntry(`${srcDir}/**/*.tsx`));

  for (const pattern of entry) inputs.push(toEntry(pattern));

  for (const script of collectPropertyValues(program, 'globalScript')) {
    inputs.push(toProductionEntry(script));
  }

  for (const style of collectPropertyValues(program, 'globalStyle')) {
    inputs.push(toProductionEntry(style));
  }

  // v5: outputTargets: [{ type: 'global-style', input: 'src/global.scss' }]
  new Visitor({
    ObjectExpression(node: ObjectExpression) {
      const typeValues = getPropertyValues(node, 'type');
      if (!typeValues.has('global-style')) return;
      for (const input of getPropertyValues(node, 'input')) inputs.push(toProductionEntry(input));
    },
  }).visit(program);

  for (const tsconfig of collectPropertyValues(program, 'tsconfig')) {
    inputs.push(toConfig('typescript', tsconfig));
  }

  for (const setup of collectPropertyValues(program, 'setupFilesAfterEnv')) {
    inputs.push(toEntry(setup));
  }

  for (const setup of collectPropertyValues(program, 'setupFiles')) {
    inputs.push(toEntry(setup));
  }

  return inputs;
};
