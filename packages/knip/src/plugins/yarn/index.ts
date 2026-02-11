import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { Input } from '../../util/input.js';
import { toDeferResolveEntry } from '../../util/input.js';
import { isFile } from '../../util/fs.js';

// https://yarnpkg.com/features/constraints

const title = 'Yarn';

const enablers = 'This plugin is enabled when a `yarn.lock` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => isFile(cwd, 'yarn.lock');

const isRootOnly = true;

const config = ['.yarnrc.yml'];

const entry = ['yarn.config.cjs'];

type YarnConfig = {
  plugins?: Array<{
    path?: string;
  }>;
};

const resolveConfig: ResolveConfig<YarnConfig> = (localConfig, options) => {
  const inputs: Input[] = [toDeferResolveEntry('yarn.config.cjs', { containingFilePath: options.configFilePath })];
  if (!Array.isArray(localConfig.plugins)) return inputs;

  for (const plugin of localConfig.plugins) {
    if (typeof plugin.path !== 'string') continue;
    inputs.push(
      toDeferResolveEntry(plugin.path, { dir: options.configFileDir, containingFilePath: options.configFilePath })
    );
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  entry,
  resolveConfig,
};

export default plugin;
