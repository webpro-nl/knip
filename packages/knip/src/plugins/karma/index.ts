import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toEntry } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { type ConfigFile, configFiles, inputsFromFrameworks, inputsFromPlugins, loadConfig } from './helpers.ts';

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

  const basePath = toAbsolute(config.basePath ?? '', options.configFileDir);
  if (config.files) {
    for (const fileOrPatternObj of config.files) {
      const fileOrPattern = typeof fileOrPatternObj === 'string' ? fileOrPatternObj : fileOrPatternObj.pattern;
      const absPath = toAbsolute(fileOrPattern, basePath);
      inputs.add(toEntry(absPath));
    }
  }
  if (config.exclude) {
    for (const fileOrPattern of config.exclude) {
      const absPath = toAbsolute(fileOrPattern, basePath);
      inputs.add(toEntry(`!${absPath}`));
    }
  }

  return Array.from(inputs);
};

const args: Args = {
  resolveInputs: parsed => (parsed._[0] === 'start' && parsed._[1] ? [toConfig('karma', parsed._[1])] : []),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
