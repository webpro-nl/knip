import type { Program } from 'oxc-parser';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import type { MutatorObject, OverrideInput } from './types.ts';

const PATH_KEY: keyof MutatorObject = 'path';
const TRANSFORMER_KEY: keyof OverrideInput = 'transformer';

export const getInputsFromAST = (program: Program): Set<string> => {
  const values = new Set<string>();
  for (const v of collectPropertyValues(program, PATH_KEY)) values.add(v);
  for (const v of collectPropertyValues(program, TRANSFORMER_KEY)) values.add(v);
  return values;
};
