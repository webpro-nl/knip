import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://vitepress.dev/

const title = 'vitepress';

const enablers = ['vitepress'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['.vitepress/config.{js,ts,mjs,mts}', '.vitepress/theme/index.{js,ts,mjs,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
