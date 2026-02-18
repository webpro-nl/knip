import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { config as viteConfig } from '../vite/index.js';
import compiler from './compiler.js';

// https://svelte.dev/docs

const title = 'Svelte';

const enablers = ['svelte'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svelte.config.js', ...viteConfig];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('svelte')) registerCompiler({ extension: '.svelte', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
