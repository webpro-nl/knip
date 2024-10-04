import type { PluginOptions } from '#p/types/plugins.js';
import { isInternal, toAbsolute } from '#p/util/path.js';
import { load, resolveEntry } from '#p/util/plugin.js';
import type { CypressConfig } from './types.js';

interface ReporterConfig {
  reporterEnabled: string;
}

// see https://docs.cypress.io/guides/tooling/reporters
const BUILT_IN_REPORTERS: ReadonlyArray<string> = ['spec', 'junit', 'teamcity'] as const;
const IS_NOT_BUILT_IN_REPORTER = (reporter: string) => !BUILT_IN_REPORTERS.includes(reporter);

export const resolveDependencies = async (config: CypressConfig, options: PluginOptions) => {
  const { reporter } = config;
  const { configFileDir } = options;

  const resolve = (specifier: string) => resolveEntry(options, specifier);

  // Initialize the array of reporters with the initial reporter if present.
  const reporters: Set<string> = reporter ? new Set([reporter]) : new Set();
  // https://github.com/YOU54F/cypress-plugins/tree/master/cypress-multi-reporters#configuring-reporters
  if (reporter === 'cypress-multi-reporters' && config.reporterOptions?.configFile) {
    // Try to resolve the config file if present and attach the reporters listed in it.
    const { configFile } = config.reporterOptions;
    const configFilePath = toAbsolute(configFile, configFileDir);
    if (isInternal(configFilePath)) {
      const reporterConfig: ReporterConfig = await load(configFilePath);
      if (typeof reporterConfig === 'object' && reporterConfig.reporterEnabled) {
        const { reporterEnabled: reporterConcatenatedNames } = reporterConfig;
        // Pulled from the reporter source code, https://github.com/YOU54F/cypress-plugins/blob/master/cypress-multi-reporters/lib/MultiReporters.js#L50-L58
        // Not sure why they allow for extra whitespace characters, but let's handle it the same as them.
        const reporterNames = reporterConcatenatedNames.split(',');
        for (const reporterName of reporterNames) {
          reporters.add(resolve(reporterName.trim()));
        }
      }
    }
  }
  return [...reporters].filter(IS_NOT_BUILT_IN_REPORTER);
};
