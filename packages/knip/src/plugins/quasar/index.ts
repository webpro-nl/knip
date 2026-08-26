import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { production, resolveFromAST } from './resolveFromAST.ts';

// https://quasar.dev/quasar-cli-vite/quasar-config-file

const title = 'Quasar';

const enablers = ['@quasar/app', '@quasar/app-vite', '@quasar/app-webpack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['quasar.config.{js,cjs,mjs,ts}', 'quasar.conf.js'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
