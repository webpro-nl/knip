import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.sentry.io/clients/javascript/config/

type SentryConfig = {
  extends: string;
};

export const NAME = 'Sentry';

/** @public */
export const ENABLERS = ['@sentry/replay'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const ENTRY_FILE_PATTERNS = ['sentry.{client,server}.config.{js,ts}'];

const findNycDependencies: GenericPluginCallback = async configFilePath => {
  const config: SentryConfig = await _load(configFilePath);
  return [config.extends];
};

export const findDependencies = timerify(findNycDependencies);
