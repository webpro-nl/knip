import { compact } from '../../util/array.js';
import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { VitestConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://vitest.dev/config/

export const NAME = 'Vitest';

/** @public */
export const ENABLERS = ['vitest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vitest.config.ts'];

// `TEST_FILE_PATTERNS` in src/constants.ts are already included by default
export const ENTRY_FILE_PATTERNS = ['vite.config.ts'];

const findVitestDependencies: GenericPluginCallback = async (configFilePath, { cwd }) => {
  const config: VitestConfig = await load(configFilePath);
  if (!config || !config.test) return [];
  const cfg = config.test;
  const environments = cfg.environment ? [getEnvPackageName(cfg.environment)] : [];
  const reporters = getExternalReporters(cfg.reporters);
  const coverage = cfg.coverage ? [`@vitest/coverage-${cfg.coverage.provider ?? 'v8'}`] : [];
  const setupFiles = cfg.setupFiles ? [cfg.setupFiles].flat().map(filePath => join(cwd, filePath)) : [];
  const globalSetup = cfg.globalSetup ? [cfg.globalSetup].flat().map(filePath => join(cwd, filePath)) : [];
  return compact([...environments, ...reporters, ...coverage, ...setupFiles, ...globalSetup]);
};

export const findDependencies = timerify(findVitestDependencies);
