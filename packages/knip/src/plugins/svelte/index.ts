import type { IsPluginEnabled, Plugin, Resolve, ResolveConfig } from '../../types/config.js';
import { toAlias, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { config as viteConfig } from '../vite/index.js';
import type { SvelteKitConfig } from './types.js';

// https://kit.svelte.dev/docs

const title = 'Svelte';

const enablers = ['svelte'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svelte.config.js', ...viteConfig];

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*.{js,ts}',
];

const resolve: Resolve = options => {
  return [
    toAlias('$app/*', [join(options.cwd, 'node_modules/@sveltejs/kit/src/runtime/app/*')]),
    // https://svelte.dev/docs/kit/$service-worker
    toAlias('$service-worker', [join(options.cwd, 'node_modules/@sveltejs/kit/types/index.d.ts')]),
  ];
};

export const config = ['svelte.config.{js,mjs,ts,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<SvelteKitConfig> = localConfig => {
  // https://svelte.dev/docs/kit/configuration#serviceWorker
  if (localConfig.kit?.serviceWorker?.register === false) {
    return [];
  }

  // https://svelte.dev/docs/kit/configuration#files
  let serviceWorkerPath = localConfig.kit?.files?.serviceWorker ?? 'src/service-worker';
  if (!serviceWorkerPath.endsWith('.js') && !serviceWorkerPath.endsWith('.ts')) {
    serviceWorkerPath += '{.js,.ts,/index.js,/index.ts}';
  }

  return [toEntry(serviceWorkerPath)];
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  resolveConfig,
  resolve,
} satisfies Plugin;
