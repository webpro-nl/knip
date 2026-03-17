import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://www.sanity.io/docs/configuration

const title = 'Sanity';

const enablers = ['sanity'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['sanity.config.{js,jsx,ts,tsx}', 'sanity.cli.{ts,js}', 'sanity.blueprint.{ts,js,json}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
