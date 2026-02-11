import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { isFile } from '../../util/fs.js';
import type { Input } from '../../util/input.js';
import { toEntry } from '../../util/input.js';

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

const resolveConfig: ResolveConfig<YarnConfig> = config => {
  const inputs: Input[] = [];

  if (!Array.isArray(config.plugins)) return inputs;

  for (const plugin of config.plugins) {
    if (plugin.path) {
      inputs.push(toEntry(plugin.path));
    }
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
