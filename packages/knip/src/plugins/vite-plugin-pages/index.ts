import type { IsPluginEnabled, Plugin, Resolve, ResolveFromAST } from '../../types/config.ts';
import { toIgnore, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getVitePluginDirs } from '../vite/helpers.ts';

// https://github.com/hannoeru/vite-plugin-pages

const title = 'vite-plugin-pages';

const enablers = ['vite-plugin-pages'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const extensions = 'vue,jsx,tsx,md,mdx';
const defaultDir = 'src/pages';

const production = [`${defaultDir}/**/*.{${extensions}}`];

const resolveFromAST: ResolveFromAST = (program, options) => {
  const dirs = getVitePluginDirs(program, enablers, 'dirs') ?? [defaultDir];
  return dirs.map(dir => toProductionEntry(join(options.configFileDir, `${dir}/**/*.{${extensions}}`)));
};

const resolve: Resolve = () =>
  ['~pages', '~react-pages', '~solid-pages'].map(specifier => toIgnore(specifier, 'unresolved'));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
  resolve,
};

export default plugin;
