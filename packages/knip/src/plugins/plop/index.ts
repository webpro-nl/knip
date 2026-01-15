import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/plopjs/plop/blob/main/README.md

const title = 'Plop';

const enablers = ['plop'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['plopfile.{cjs,mjs,js,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
