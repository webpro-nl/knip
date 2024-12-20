import { type Input, toDeferResolveEntry, toDevDependency } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
import type { Config, ConfigOptions } from './types.js';

//👇 All but CoffeeScript ones. Low usage nowadays compared to the effort to implement support for those files
export const configFiles = ['karma.conf.js', 'karma.conf.ts', '.config/karma.conf.js', '.config/karma.conf.ts'];

export const inputsFromFrameworks = (frameworks: readonly string[]): readonly Input[] =>
  frameworks.map(framework => {
    return toDevDependency(framework === 'jasmine' ? 'jasmine-core' : framework);
  });

export const inputsFromPlugins = (
  plugins: ConfigOptions['plugins'],
  devDependencies: Record<string, string> | undefined
): readonly Input[] => {
  if (!plugins) {
    const karmaPluginDevDeps = Object.keys(devDependencies ?? {}).filter(name => name.startsWith('karma-'));
    return karmaPluginDevDeps.map(karmaPluginDevDep => toDevDependency(karmaPluginDevDep));
  }
  return plugins
    .map(plugin => {
      if (typeof plugin !== 'string') return;
      return isInternal(plugin) ? toDeferResolveEntry(plugin) : toDevDependency(plugin);
    })
    .filter(input => !!input);
};

export type ConfigFile = (config: Config) => void;
export const loadConfig = (configFile: ConfigFile): ConfigOptions | undefined => {
  if (typeof configFile !== 'function') return;
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
