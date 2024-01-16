import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.sentry.io/platforms/javascript/configuration/

const NAME = 'Sentry';

const ENABLERS = [/^@sentry\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['sentry.{client,server,edge}.config.{js,ts}'];

const findSentryDependencies: GenericPluginCallback = async () => {
  const entryPatterns = ENTRY_FILE_PATTERNS.map(toEntryPattern);
  return entryPatterns;
};

const findDependencies = timerify(findSentryDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};
