import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://tailwindcss.com/docs/configuration

const NAME = 'Tailwind';

const ENABLERS = ['tailwindcss'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['tailwind.config.{js,cjs,mjs,ts}'];

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
};
