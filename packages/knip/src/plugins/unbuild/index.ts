import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/unjs/unbuild#unbuild

export const NAME = 'unbuild';

/** @public */
export const ENABLERS = ['unbuild'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['build.config.{js,cjs,mjs,ts,mts,cts,json}'];

/** @public */
export const ENTRY_FILE_PATTERNS = [];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [];

export const PROJECT_FILE_PATTERNS = [];

const findPluginDependencies: GenericPluginCallback = async () => [];

export const findDependencies = timerify(findPluginDependencies);
