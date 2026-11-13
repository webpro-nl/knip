import type { ResolveFromAST } from '../../types/config.ts';
import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toDependency, toEntry } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { toProviderInput } from '../mdx/index.ts';

export const production = ['{src/,}mdx-components.{js,jsx,ts,tsx}'];

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const inputs: Input[] = production.map(id => toEntry(id, { production: true }));
  const plugins = new Set<string>();
  for (const call of findImportedCalls(program, '@next/mdx')) {
    const mdxOptions = findProperty(call.arguments?.[0], 'options');
    if (mdxOptions?.type !== 'ObjectExpression') continue;
    for (const pluginType of ['remarkPlugins', 'rehypePlugins', 'recmaPlugins']) {
      for (const id of getStringValues(findProperty(mdxOptions, pluginType))) plugins.add(id);
    }
    const provider = getStringValue(findProperty(mdxOptions, 'providerImportSource'));
    if (provider && !isInternal(provider)) inputs.push(toProviderInput(provider, options.configFileDir));
  }
  for (const id of plugins) inputs.push(toDependency(id));
  return inputs;
};
