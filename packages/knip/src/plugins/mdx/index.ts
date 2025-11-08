import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { MdxConfig } from './types.js';

const title = 'MDX';

const enablers = ['astro', 'mdxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const takeDependencies = (config: MdxConfig) => {
  const inputs: Input[] = [];
  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (typeof plugin === 'string') inputs.push(toDependency(plugin));
      else if (typeof plugin[0] === 'string') inputs.push(toDependency(plugin[0]));
    }
  }
  return inputs;
};

const resolveConfig: ResolveConfig<MdxConfig | { mdx: MdxConfig }> = async (config, options) => {
  const { configFileName } = options;

  // read by @mdx-js/typescript-plugin (https://github.com/mdx-js/mdx-analyzer#plugins)
  if (configFileName === 'tsconfig.json' && 'mdx' in config) return takeDependencies(config.mdx);

  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
