import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { config as viteConfig } from '../vite/index.ts';
import { resolveFromAST } from './resolveFromAST.ts';

// https://svelte.dev/docs/kit

const title = 'SvelteKit';

const enablers = ['@sveltejs/kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['svelte.config.js', ...viteConfig];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
