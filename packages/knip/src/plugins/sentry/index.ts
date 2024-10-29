import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.sentry.io/platforms/javascript/configuration/

const title = 'Sentry';

const enablers = [/^@sentry\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['sentry.{client,server,edge}.config.{js,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
