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
  'src/service-worker.{js,ts}',
  'src/service-worker/index.{js,ts}',
  'src/instrumentation.server.{js,ts}',
];

const resolve: Resolve = options => {
  const alias = toAlias('$app/*', [join(options.cwd, 'node_modules/@sveltejs/kit/src/runtime/app/*')]);
  const serviceWorkerAlias = toAlias('$service-worker', [
    join(options.cwd, 'node_modules/@sveltejs/kit/src/runtime/service-worker.js'),
  ]);
  return [alias, serviceWorkerAlias];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  resolve,
};

export default plugin;
