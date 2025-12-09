import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://next-intl.dev/docs/getting-started/app-router

const title = 'next-intl';

const enablers = ['next-intl'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['{src/,}i18n/request.{js,jsx,ts,tsx}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
};

export default plugin;
