import type ts from 'typescript';
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

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolveFromAST,
} satisfies Plugin;
