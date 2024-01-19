import { DEFAULT_EXTENSIONS } from '../../constants.js';
import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import type { FunctionsConfig, NetlifyConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.netlify.com/ or https://docs.netlify.com/functions/get-started/?fn-language=ts

const NAME = 'Netlify';

const ENABLERS = ['@netlify/functions'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS: string[] = ['netlify.toml'];

const ENTRY_FILE_PATTERNS: string[] = [];

const PRODUCTION_ENTRY_FILE_PATTERNS: string[] = [
  `netlify/functions/**/*.{${DEFAULT_EXTENSIONS.filter(ext => !ext.endsWith('x'))
    .map(ext => ext.slice(1))
    .join(',')}}`,
];

const PROJECT_FILE_PATTERNS: string[] = [];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  const localConfig: NetlifyConfig | undefined = await load(configFilePath);
  if (!localConfig)
    return config.entry
      ? config.entry.map(toProductionEntryPattern)
      : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);

  const dependencies = [
    ...(localConfig?.plugins?.map(plugin => plugin.package) ?? []),
    ...(localConfig?.functions?.external_node_modules ?? []),
    ...(
      Object.values(localConfig.functions || {}).filter(
        x => typeof x === 'object' && 'external_node_modules' in x
      ) as FunctionsConfig[]
    ).flatMap(x => x?.external_node_modules || []),
  ];
  const entryFiles = localConfig?.functions?.included_files ?? [];
  if (localConfig.functions?.directory) {
    entryFiles.push(
      join(
        localConfig.functions.directory,
        // Filter out `[j|t]sx`.
        `**/*.{${DEFAULT_EXTENSIONS.filter(ext => !ext.endsWith('x'))
          .map(ext => ext.slice(1))
          .join(',')}}`
      )
    );
  }

  return [...dependencies, ...(localConfig?.functions?.included_files ?? []).map(toProductionEntryPattern)];
};

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  PROJECT_FILE_PATTERNS,
  findDependencies,
};
