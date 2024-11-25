import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/plopjs/plop/blob/main/README.md

const title = 'Plop';

const enablers = ['plop'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['plopfile.{cjs,mjs,js,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
