import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/loicduong/vite-plugin-vue-layouts-next

const title = 'vite-plugin-vue-layouts-next';

const enablers = ['vite-plugin-vue-layouts-next', 'vite-plugin-vue-layouts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['src/layouts/**/*.vue'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
};

export default plugin;
