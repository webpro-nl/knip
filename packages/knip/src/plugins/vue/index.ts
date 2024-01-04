import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { VueConfig, WebpackConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://cli.vuejs.org/config/
// https://vuejs.org/guide/scaling-up/tooling.html#vue-cli

export const NAME = 'Vue';

/** @public */
export const ENABLERS = ['vue'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vue.config.{js,ts}'];

/** @public */
export const ENTRY_FILE_PATTERNS = [];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [];

export const PROJECT_FILE_PATTERNS = [];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config, isProduction, cwd, manifest } = options;

  const localConfig: VueConfig | undefined = await load(configFilePath);

  const deps = config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];

  if (isProduction || !localConfig) return deps;

  if (localConfig.configureWebpack) {
    const baseConfig = {
      mode: 'development',
      entry: {},
      resolve: {},
      plugins: [],
      module: { rules: [] },
    } satisfies WebpackConfiguration;
    const modifiedConfig =
      typeof localConfig.configureWebpack === 'function'
        ? localConfig.configureWebpack(baseConfig)
        : localConfig.configureWebpack;
    const { dependencies } = await findWebpackDependenciesFromConfig({
      config: modifiedConfig ?? baseConfig,
      cwd,
    });
    dependencies.forEach(dependency => deps.push(dependency));
  }

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)vue-cli-service(\s|\s.+\s)lint(?=\s|$)/.test(script))
  ) {
    deps.push('@vue/cli-plugin-eslint');
  }

  return deps;
};

export const findDependencies = timerify(findPluginDependencies);
