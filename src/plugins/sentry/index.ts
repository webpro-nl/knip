import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.sentry.io/platforms/javascript/configuration/

export const NAME = 'Sentry';

/** @public */
export const ENABLERS = [/^@sentry\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['sentry.{client,server}.config.{js,ts}'];
