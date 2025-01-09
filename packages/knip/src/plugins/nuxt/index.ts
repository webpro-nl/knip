import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { NuxtConfig } from './types.js';

const title = 'Nuxt';

const enablers = ['nuxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => {
  const isEnabled = hasDependency(dependencies, enablers);

  // TODO Add generic way for plugins to init?
  if (isEnabled && !('defineNuxtConfig' in globalThis)) (globalThis as any).defineNuxtConfig = (c: any) => c;

  return isEnabled;
};

const entry = ['nuxt.config.{js,mjs,ts}'];

const production = [
  'app.vue',
  'error.vue',
  'pages/**/*.vue',
  'layouts/default.vue',
  'middleware/**/*.ts',
  'server/api/**/*.ts',
  'server/routes/**/*.ts',
  'server/middleware/**/*.ts',
  'server/plugins/**/*.ts',
];

const resolveEntryPaths: ResolveEntryPaths<NuxtConfig> = async localConfig => {
  const srcDir = localConfig.srcDir ?? '.';

  const patterns = [
    'app.vue',
    'error.vue',
    join(typeof localConfig.dir?.pages === 'string' ? localConfig.dir.pages : 'pages', '**/*.vue'),
    join(typeof localConfig.dir?.layouts === 'string' ? localConfig.dir.layouts : 'layouts', '**/*.vue'),
    join(typeof localConfig.dir?.middleware === 'string' ? localConfig.dir.middleware : 'middleware', '**/*.ts'),
    'server/api/**/*.ts',
    'server/routes/**/*.ts',
    'server/middleware/**/*.ts',
    'server/plugins/**/*.ts',
  ];

  return patterns.map(pattern => toProductionEntry(join(srcDir, pattern)));
};

const note = `Knip works best with [explicit imports](https://nuxt.com/docs/guide/concepts/auto-imports#explicit-imports).
Nuxt allows to [disable auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports#disabling-auto-imports).`;

/** @public */
export const docs = { note };

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
  resolveEntryPaths,
} satisfies Plugin;
