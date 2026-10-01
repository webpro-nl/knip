import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://vite-pwa-org.netlify.app/assets-generator/

const title = '@vite-pwa/assets-generator';

const enablers = ['@vite-pwa/assets-generator'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['pwa-assets.config.{js,cjs,mjs,ts,cts,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
