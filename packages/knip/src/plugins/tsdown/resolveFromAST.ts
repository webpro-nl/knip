import type { Program } from 'oxc-parser';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';

export const getEntryFromAST = (program: Program): Set<string> => {
  return collectPropertyValues(program, 'entry');
};
