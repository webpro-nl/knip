import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/plopjs/plop/blob/main/README.md

const title = 'Plop';

const enablers = ['plop'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['plopfile.{cjs,mjs,js,ts}'];

const args = {
  config: ['plopfile'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
