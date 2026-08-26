import type { ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry } from '../../util/input.ts';
import type { MutatorObject, OverrideInput } from './types.ts';

const PATH_KEY: keyof MutatorObject = 'path';
const TRANSFORMER_KEY: keyof OverrideInput = 'transformer';

export const resolveFromAST: ResolveFromAST = program => {
  const values = [...collectPropertyValues(program, PATH_KEY), ...collectPropertyValues(program, TRANSFORMER_KEY)];
  return values.map(id => toEntry(id));
};
