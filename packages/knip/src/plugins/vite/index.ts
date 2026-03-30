import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, RegisterVisitors, Resolve, ResolveFromAST } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveConfig } from '../vitest/index.ts';
import { getIndexHtmlEntries, getReactBabelPlugins } from './helpers.ts';
import { createImportMetaGlobVisitor } from './visitors/importMetaGlob.ts';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const resolveFromAST: ResolveFromAST = program => {
  const babelPlugins = getReactBabelPlugins(program);
  return babelPlugins.map(plugin => toDependency(plugin));
};

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createImportMetaGlobVisitor(ctx));
};

const resolve: Resolve = async options => {
  return getIndexHtmlEntries(options.cwd);
};

const args: Args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolveFromAST,
  resolve,
  registerVisitors,
  args,
};

export default plugin;
