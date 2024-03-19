import { hasDependency } from '#p/util/plugin.js';
import { config as viteConfig } from '../vite/index.js';
import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://kit.svelte.dev/docs

const title = 'Svelte';

const enablers = ['svelte'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svelte.config.js', ...viteConfig];

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*{js,ts}',
];

const project = ['src/**/*.{js,ts,svelte}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  project,
};
