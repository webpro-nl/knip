import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { GatsbyActions, GatsbyConfig, GatsbyNode } from './types.js';

// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/gatsby-project-structure.md
// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/config-files/gatsby-config.md

const title = 'Gatsby';

const enablers = ['gatsby', 'gatsby-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['gatsby-{config,node}.{js,jsx,ts,tsx}', 'plugins/**/gatsby-node.{js,jsx,ts,tsx}'];

const production = [
  'gatsby-{browser,ssr}.{js,jsx,ts,tsx}',
  'src/api/**/*.{js,ts}',
  'src/pages/**/*.{js,jsx,ts,tsx}',
  'src/templates/**/*.{js,jsx,ts,tsx}',
  'src/html.{js,jsx,ts,tsx}',
  'plugins/**/gatsby-{browser,ssr}.{js,jsx,ts,tsx}',
];

const resolveConfig: ResolveConfig<GatsbyConfig | GatsbyNode> = async (localConfig, options) => {
  const { configFileName } = options;

  if (/gatsby-config/.test(configFileName)) {
    return (localConfig as GatsbyConfig).plugins.map(plugin => (typeof plugin === 'string' ? plugin : plugin.resolve));
  }

  if (/gatsby-node/.test(configFileName)) {
    const plugins = new Set<string>();
    const actions: GatsbyActions['actions'] = { setBabelPlugin: plugin => plugins.add(plugin.name) };
    const _config = localConfig as GatsbyNode;
    if (typeof _config.onCreateBabelConfig === 'function') {
      _config.onCreateBabelConfig({ actions });
    }
    return Array.from(plugins);
  }

  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
};
