import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://turborepo.com/docs/guides/generating-code

const title = 'Turborepo';

const enablers = ['turbo', '@turbo/gen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['turbo/generators/config.{js,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
