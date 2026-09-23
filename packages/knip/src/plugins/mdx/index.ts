import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MdxConfig } from './types.ts';

const title = 'MDX';

const enablers = ['astro', 'mdxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const takeDependencies = (plugins: unknown) => {
  const inputs: Input[] = [];
  if (Array.isArray(plugins)) {
    for (const plugin of plugins) {
      if (typeof plugin === 'string') inputs.push(toDependency(plugin));
      else if (Array.isArray(plugin) && typeof plugin[0] === 'string') inputs.push(toDependency(plugin[0]));
    }
  }
  return inputs;
};

export const contentMappers = ['mdx-content-mapper', '@mdx-js/content-mapper'];

const bundledPlugins = ['remark-mdx-frontmatter'];

export const resolveContentMapperOptions = (options: Record<string, unknown>) =>
  takeDependencies(options.remarkPlugins).filter(input => !bundledPlugins.includes(input.specifier));

const resolveConfig: ResolveConfig<MdxConfig | { mdx: MdxConfig }> = async (config, options) => {
  const { configFileName } = options;

  // read by @mdx-js/typescript-plugin (https://github.com/mdx-js/mdx-analyzer#plugins)
  if (configFileName === 'tsconfig.json' && 'mdx' in config) return takeDependencies(config.mdx.plugins);

  return [];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
