import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { MdxConfig } from './types.js';

const title = 'MDX';

const enablers = ['astro', 'mdxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const takeDependencies = (config: MdxConfig) =>
  Array.isArray(config.plugins) ? config.plugins.map(id => toDependency(id)) : [];

const resolveConfig: ResolveConfig<MdxConfig | { mdx: MdxConfig }> = async (config, options) => {
  const { configFileName } = options;

  // read by @mdx-js/typescript-plugin
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
