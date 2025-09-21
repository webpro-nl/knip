import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/antfu-collective/bumpp#bumpp

const title = 'bumpp';

const enablers = ['bumpp'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['bump.config.{mjs,ts,js,cjs,mts,cts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
