import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getVitePluginDirs } from '../vite/helpers.ts';

// https://github.com/loicduong/vite-plugin-vue-layouts-next

const title = 'vite-plugin-vue-layouts-next';

const enablers = ['vite-plugin-vue-layouts-next', 'vite-plugin-vue-layouts', 'vite-plugin-vue-meta-layouts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const defaultDir = 'src/layouts';

const production = [`${defaultDir}/**/*.vue`];

const resolveFromAST: ResolveFromAST = (program, options) => {
  const dirs = getVitePluginDirs(program, enablers, 'layoutsDirs') ?? [defaultDir];
  return dirs.map(dir => toProductionEntry(join(options.configFileDir, `${dir}/**/*.vue`)));
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
