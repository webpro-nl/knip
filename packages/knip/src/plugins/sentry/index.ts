import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://docs.sentry.io/platforms/javascript/configuration/

const title = 'Sentry';

const enablers = [/^@sentry\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['sentry.{client,server,edge}.config.{js,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
};

export default plugin;
