import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/unplugin/unplugin-icons

const title = 'unplugin-icons';

const enablers = ['unplugin-icons'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolve: Resolve = () => [
  toIgnore('~icons/.*', 'unresolved'),
  toIgnore('@iconify-json/.*', 'dependencies'),
  toIgnore('@iconify/json', 'dependencies'),
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;
