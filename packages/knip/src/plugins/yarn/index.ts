import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import type { Input } from '../../util/input.ts';
import { toEntry } from '../../util/input.ts';

// https://yarnpkg.com/features/constraints

const title = 'Yarn';

const enablers = 'This plugin is enabled when a `yarn.lock` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => isFile(cwd, 'yarn.lock');

const isRootOnly = true;

const config = ['.yarnrc.yml'];

const entry = ['yarn.config.cjs'];

type YarnConfig = {
  plugins?: Array<string | { path?: string }>;
  yarnPath?: string;
};

const resolveConfig: ResolveConfig<YarnConfig> = config => {
  const inputs: Input[] = entry.map(id => toEntry(id));

  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (typeof plugin === 'string') inputs.push(toEntry(plugin));
      else if (typeof plugin.path === 'string') inputs.push(toEntry(plugin.path));
    }
  }

  if (config.yarnPath) {
    inputs.push(toEntry(config.yarnPath));
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
