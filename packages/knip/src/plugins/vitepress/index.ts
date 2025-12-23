import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://vitepress.dev/

const title = 'vitepress';

const enablers = ['vitepress'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry: string[] = [
  ".vitepress/config.{js,ts,mjs,mts}",
  ".vitepress/theme/index.{js,ts,mjs,mts}"
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
