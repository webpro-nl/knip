import type { ResolveFromAST } from '../../types/config.ts';
import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';

const enablers = ['laravel-vite-plugin'];

const addStringOrArray = (values: Set<string>, node: unknown) => {
  const single = getStringValue(node);
  if (single !== undefined) values.add(single);
  for (const value of getStringValues(node)) values.add(value);
};

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const inputs: Input[] = [];
  for (const call of findImportedCalls(program, enablers)) {
    const arg = call.arguments?.[0];
    if (!arg) continue;
    const specifiers = new Set<string>();
    addStringOrArray(specifiers, arg);
    addStringOrArray(specifiers, findProperty(arg, 'input'));
    addStringOrArray(specifiers, findProperty(arg, 'ssr'));
    for (const id of specifiers) inputs.push(toProductionEntry(join(options.configFileDir, id)));
  }
  return inputs;
};
