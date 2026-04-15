import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vitepress.dev/

const title = 'VitePress';

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
