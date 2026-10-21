import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, Resolve, ResolveFromAST } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveConfig } from '../vitest/index.ts';
import { getBabelInputs, getIndexHtmlEntries } from './helpers.ts';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest', 'vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const resolveFromAST: ResolveFromAST = getBabelInputs;

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
  nativeVisitors: ['vite'],
  args,
};

export default plugin;
