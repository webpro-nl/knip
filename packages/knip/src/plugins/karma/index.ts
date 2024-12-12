import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { type Input, toDeferResolveEntry, toDevDependency, toEntry } from '../../util/input.js';
import { isInternal, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { Config, ConfigOptions } from './types.js';

// https://karma-runner.github.io/latest/config/configuration-file.html

const title = 'Karma';

const enablers = ['karma'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

//👇 All but CoffeeScript ones. Low usage nowadays compared to the effort to implement support for those files
const config = ['karma.conf.js', 'karma.conf.ts', '.config/karma.conf.js', '.config/karma.conf.ts'];

const entry: string[] = [];

type ConfigFile = (config: Config) => void;

const resolveConfig: ResolveConfig<ConfigFile> = async (localConfig, options) => {
  const inputs = new Set<Input>();

  const config = loadConfig(localConfig);

  if (config.frameworks) {
    for (const framework of config.frameworks) {
      inputs.add(toDevDependency(devDepForFramework(framework)));
    }
  }
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (typeof plugin !== 'string') continue;
      if (isInternal(plugin)) {
        inputs.add(toDeferResolveEntry(plugin));
      } else {
        inputs.add(toDevDependency(plugin));
      }
    }
  } else {
    const karmaPluginDevDeps = Object.keys(options.manifest.devDependencies ?? {}).filter(name =>
      name.startsWith('karma-')
    );
    for (const karmaPluginDevDep of karmaPluginDevDeps) {
      inputs.add(toDevDependency(karmaPluginDevDep));
    }
  }

  return Array.from(inputs);
};

const devDepForFramework = (framework: string): string => (framework === 'jasmine' ? 'jasmine-core' : framework);

const resolveEntryPaths: ResolveEntryPaths<ConfigFile> = (localConfig, options) => {
  const inputs = new Set<Input>();

  const config = loadConfig(localConfig);

  const basePath = config.basePath ?? '';
  if (config.files) {
    for (const fileOrPatternObj of config.files) {
      const fileOrPattern = typeof fileOrPatternObj === 'string' ? fileOrPatternObj : fileOrPatternObj.pattern;
      inputs.add(toEntry(join(options.configFileDir, basePath, fileOrPattern)));
    }
  }
  if (config.exclude) {
    for (const fileOrPattern of config.exclude) {
      inputs.add(toEntry(`!${join(options.configFileDir, basePath, fileOrPattern)}`));
    }
  }

  return Array.from(inputs);
};

const loadConfig = (configFile: ConfigFile): ConfigOptions => {
  const inMemoryConfig = new InMemoryConfig();
  configFile(inMemoryConfig);
  return inMemoryConfig.config ?? {};
};

/**
 * Dummy configuration class with no default config options
 * Relevant config options' defaults are empty, so that's good enough
 * Real class: https://github.com/karma-runner/karma/blob/v6.4.4/lib/config.js#L275
 */
class InMemoryConfig implements Config {
  config?: ConfigOptions;
  /**
   * Real method merges configurations with Lodash's `mergeWith`
   * https://github.com/karma-runner/karma/blob/v6.4.4/lib/config.js#L343
   */
  set(config: ConfigOptions) {
    this.config = config;
  }
}

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  resolveEntryPaths,
} satisfies Plugin;
