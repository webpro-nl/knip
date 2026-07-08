import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/hannoeru/vite-plugin-pages

const title = 'vite-plugin-pages';

const enablers = ['vite-plugin-pages'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['src/pages/**/*.{vue,jsx,tsx,md,mdx}'];

const resolve: Resolve = () =>
  ['~pages', '~react-pages', '~solid-pages'].map(specifier => toIgnore(specifier, 'unresolved'));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
  resolve,
};

export default plugin;
