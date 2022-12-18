import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.sentry.io/clients/javascript/config/

type SentryConfig = {
  extends: string;
};

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('@sentry/replay');

export const ENTRY_FILE_PATTERNS = ['sentry.{client,server}.config.{js,ts}'];

const findNycDependencies: GenericPluginCallback = async configFilePath => {
  const config: SentryConfig = await _load(configFilePath);
  return [config.extends];
};

export const findDependencies = timerify(findNycDependencies);
