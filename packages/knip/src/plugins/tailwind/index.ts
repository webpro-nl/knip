import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';

// https://tailwindcss.com/docs/configuration

const title = 'Tailwind';

const enablers = ['tailwindcss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
