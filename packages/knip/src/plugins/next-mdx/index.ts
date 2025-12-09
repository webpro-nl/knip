import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { toDependency, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { getMdxPlugins } from './resolveFromAST.js';

// https://nextjs.org/docs/pages/building-your-application/configuring/mdx

const title = 'Next.js MDX';

const enablers = ['@next/mdx'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs}'];

const production = ['{src/,}mdx-components.{js,jsx,ts,tsx}'];

const resolveFromAST: ResolveFromAST = sourceFile => {
  const mdxPlugins = getMdxPlugins(sourceFile);
  return [...production.map(id => toProductionEntry(id)), ...Array.from(mdxPlugins).map(id => toDependency(id))];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
