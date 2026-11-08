import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://danger.systems/js/guides/getting_started

const title = 'Danger';

const enablers = ['danger'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['dangerfile.{js,cjs,mjs,ts,mts}', 'Dangerfile.{js,mjs,ts,mts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
