import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import { extractFunctionsConfigProperty } from './helpers.js';
import type { NetlifyConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.netlify.com
// https://docs.netlify.com/functions/get-started/

const NAME = 'Netlify';

const ENABLERS = [/^@netlify\/plugin-/, 'netlify-cli', '@netlify/functions'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS: string[] = ['netlify.toml'];

const NETLIFY_FUNCTIONS_DIR = 'netlify/functions';
const NETLIFY_FUNCTIONS_EXTS = 'js,mjs,cjs,ts,mts,cts';

const PRODUCTION_ENTRY_FILE_PATTERNS: string[] = [`${NETLIFY_FUNCTIONS_DIR}/**/*.{${NETLIFY_FUNCTIONS_EXTS}}`];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  const localConfig: NetlifyConfig | undefined = await load(configFilePath);
  if (!localConfig)
    return config.entry
      ? config.entry.map(toProductionEntryPattern)
      : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);

  const dependencies = [
    ...(localConfig?.plugins?.map(plugin => plugin.package) ?? []),
    ...extractFunctionsConfigProperty(localConfig.functions || {}, 'external_node_modules'),
  ];

  const entryFiles = [
    ...extractFunctionsConfigProperty(localConfig.functions || {}, 'included_files'),
    join(localConfig.functions?.directory ?? NETLIFY_FUNCTIONS_DIR, `**/*.{${NETLIFY_FUNCTIONS_EXTS}}`),
  ].filter(file => !file.startsWith('!'));

  return [...dependencies, ...entryFiles.map(toProductionEntryPattern)];
};

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  findDependencies,
};
