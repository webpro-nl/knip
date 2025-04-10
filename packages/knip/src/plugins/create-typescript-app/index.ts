import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/JoshuaKGoldberg/create-typescript-app

const title = 'create-typescript-app';

const enablers = ['create-typescript-app'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['create-typescript-app.config.{js,cjs,mjs,ts}'];

export default {
  enablers,
  entry,
  isEnabled,
  title,
} satisfies Plugin;
