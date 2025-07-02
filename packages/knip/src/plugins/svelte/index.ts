import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toAlias } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { config as viteConfig } from '../vite/index.js';

// https://kit.svelte.dev/docs

const title = 'Svelte';

const enablers = ['svelte'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svelte.config.js', ...viteConfig];

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*.{js,ts}',
  'src/service-worker{.js,.ts,/index.{js,ts}}',
];

const resolve: Resolve = options => {
  const app = toAlias('$app/*', [join(options.cwd, 'node_modules/@sveltejs/kit/src/runtime/app/*')]);
  const sw = toAlias('$service-worker', [join(options.cwd, 'node_modules/@sveltejs/kit/types/index.d.ts')]);
  return [app, sw];
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  resolve,
} satisfies Plugin;
