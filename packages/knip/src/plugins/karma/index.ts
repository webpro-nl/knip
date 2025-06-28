import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toEntry } from '../../util/input.js';
import { isAbsolute, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { type ConfigFile, configFiles, inputsFromFrameworks, inputsFromPlugins, loadConfig } from './helpers.js';

// https://karma-runner.github.io/latest/config/configuration-file.html

const title = 'Karma';

const enablers = ['karma'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = configFiles;

const resolveConfig: ResolveConfig<ConfigFile> = async (localConfig, options) => {
  const inputs = new Set<Input>();

  const config = loadConfig(localConfig);
  if (!config) return [];

  if (config.frameworks) {
    inputsFromFrameworks(config.frameworks).forEach(inputs.add, inputs);
  }

  inputsFromPlugins(config.plugins, options.manifest.devDependencies).forEach(inputs.add, inputs);

  const basePath = config.basePath ?? '';
  if (config.files) {
    for (const fileOrPatternObj of config.files) {
      const fileOrPattern = typeof fileOrPatternObj === 'string' ? fileOrPatternObj : fileOrPatternObj.pattern;
      const absPath = isAbsolute(fileOrPattern) ? fileOrPattern : join(options.configFileDir, basePath, fileOrPattern);
      inputs.add(toEntry(absPath));
    }
  }
  if (config.exclude) {
    for (const fileOrPattern of config.exclude) {
      const absPath = isAbsolute(fileOrPattern) ? fileOrPattern : join(options.configFileDir, basePath, fileOrPattern);
      inputs.add(toEntry(`!${absPath}`));
    }
  }

  return Array.from(inputs);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
