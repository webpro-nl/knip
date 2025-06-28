import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://tailwindcss.com/docs/configuration
// Tailwinds lilconfig dependency is only used for postcss

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
