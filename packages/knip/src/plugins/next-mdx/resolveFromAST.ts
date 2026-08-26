import type { Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';

export const production = ['{src/,}mdx-components.{js,jsx,ts,tsx}'];

const getMdxPlugins = (program: Program) => {
  const plugins = new Set<string>();
  for (const call of findImportedCalls(program, '@next/mdx')) {
    const options = findProperty(call.arguments?.[0], 'options');
    if (options?.type !== 'ObjectExpression') continue;
    for (const pluginType of ['remarkPlugins', 'rehypePlugins', 'recmaPlugins']) {
      for (const v of getStringValues(findProperty(options, pluginType))) plugins.add(v);
    }
  }
  return plugins;
};

export const resolveFromAST: ResolveFromAST = program => [
  ...production.map(id => toProductionEntry(id)),
  ...Array.from(getMdxPlugins(program)).map(id => toDependency(id)),
];
