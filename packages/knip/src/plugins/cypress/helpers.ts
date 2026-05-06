import type { PluginOptions } from '../../types/config.ts';
import { isInternal, toAbsolute } from '../../util/path.ts';
import { load } from '../../util/plugin.ts';
import type { CypressConfig } from './types.ts';

interface ReporterConfig {
  reporterEnabled: string;
}

export const resolveDependencies = async (config: CypressConfig, options: PluginOptions) => {
  const { configFileDir } = options;
  const reporters = new Set<string>();

  // Reporter can be set at the top level or per testing type (e2e, component).
  // https://docs.cypress.io/app/references/configuration#Reporter
  for (const scope of [config, config.e2e, config.component]) {
    const reporter = scope?.reporter;
    if (!reporter) continue;
    reporters.add(reporter);

    // https://github.com/YOU54F/cypress-plugins/tree/master/cypress-multi-reporters#configuring-reporters
    if (reporter === 'cypress-multi-reporters' && scope?.reporterOptions?.configFile) {
      const configFilePath = toAbsolute(scope.reporterOptions.configFile, configFileDir);
      if (isInternal(configFilePath)) {
        const reporterConfig: ReporterConfig = await load(configFilePath);
        if (typeof reporterConfig === 'object' && reporterConfig.reporterEnabled) {
          // https://github.com/YOU54F/cypress-plugins/blob/master/cypress-multi-reporters/lib/MultiReporters.js#L50-L58
          for (const name of reporterConfig.reporterEnabled.split(',')) reporters.add(name.trim());
        }
      }
    }
  }
  return [...reporters];
};
