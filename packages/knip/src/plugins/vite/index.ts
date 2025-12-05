import type ts from 'typescript';
import type { Args } from '../../types/args.js';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveConfig } from '../vitest/index.js';
import { getReactBabelPlugins } from './helpers.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  const babelPlugins = getReactBabelPlugins(sourceFile);
  return babelPlugins.map(plugin => toDependency(plugin));
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
  args,
};

export default plugin;
