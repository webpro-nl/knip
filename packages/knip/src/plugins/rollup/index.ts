import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://rollupjs.org/guide/en/#configuration-files

const title = 'Rollup';

const enablers = ['rollup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['rollup.config.{js,cjs,mjs,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} as const;
