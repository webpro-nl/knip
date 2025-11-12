import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.astro.build/en/guides/astro-db/

const title = 'Astro DB';

const enablers = ['@astrojs/db'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['db/config.{js,ts}', 'db/seed.{js,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
