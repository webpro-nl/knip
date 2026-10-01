import type { ResolveFromAST } from '../../types/config.ts';
import { findImportedCallArg, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';

export const resolveFromAST: ResolveFromAST = program => {
  const starlightConfig = findImportedCallArg(program, '@astrojs/starlight');
  if (!starlightConfig) return [];

  const inputs: Input[] = [];
  for (const id of getPropertyValues(starlightConfig, 'components')) inputs.push(toProductionEntry(id));
  for (const id of getPropertyValues(starlightConfig, 'customCss')) inputs.push(toProductionEntry(id));
  return inputs;
};
