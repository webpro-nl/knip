import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { VitestConfig } from './types.js';

// https://vitest.dev/config/

export const NAME = 'Vitest';

/** @public */
export const ENABLERS = ['vitest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vitest.config.ts', 'vite.config.ts'];

export const ENTRY_FILE_PATTERNS = ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];

const findVitestDependencies: GenericPluginCallback = async configFilePath => {
  const config: VitestConfig = await _load(configFilePath);
  if (!config || !config.test) return [];
  const cfg = config.test;
  const environments = cfg.environment ? [getEnvPackageName(cfg.environment)] : [];
  const reporters = getExternalReporters(cfg.reporters);
  const coverage = cfg.coverage?.provider ? [`@vitest/coverage-${cfg.coverage.provider}`] : [];
  return [...environments, ...reporters, ...coverage];
};

export const findDependencies = timerify(findVitestDependencies);
