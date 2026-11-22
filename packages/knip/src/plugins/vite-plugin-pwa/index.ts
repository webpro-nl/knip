import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveFromAST } from './resolveFromAST.ts';

// https://vite-pwa-org.netlify.app

const title = 'vite-plugin-pwa';

const enablers = ['vite-plugin-pwa', '@vite-pwa/nuxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}', 'nuxt.config.{js,cjs,mjs,ts,cts,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
