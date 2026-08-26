import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { defaultFilename, defaultSrcDir, resolveFromAST } from './resolveFromAST.ts';

// https://vite-pwa-org.netlify.app

const title = 'vite-plugin-pwa';

const enablers = ['vite-plugin-pwa', '@vite-pwa/nuxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}', 'nuxt.config.{js,cjs,mjs,ts,cts,mts}'];

const production = [join(defaultSrcDir, defaultFilename)];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
