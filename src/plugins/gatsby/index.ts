import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { GatsbyActions, GatsbyConfig, GatsbyNode } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/gatsby-project-structure.md
// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/config-files/gatsby-config.md

export const NAME = 'Gatsby';

/** @public */
export const ENABLERS = ['gatsby', 'gatsby-cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['gatsby-{config,node}.{js,jsx,ts,tsx}'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'gatsby-{browser,ssr}.{js,jsx,ts,tsx}',
  'src/api/**/*.{js,ts}',
  'src/pages/**/*.{js,jsx,ts,tsx}',
  'src/templates/**/*.{js,jsx,ts,tsx}',
  'src/html.{js,jsx,ts,tsx}',
];

const findGatsbyDependencies: GenericPluginCallback = async configFilePath => {
  const config: GatsbyConfig | GatsbyNode = await _load(configFilePath);

  if (/gatsby-config/.test(configFilePath)) {
    return (config as GatsbyConfig).plugins.map(plugin => (typeof plugin === 'string' ? plugin : plugin.resolve));
  }

  if (/gatsby-node/.test(configFilePath)) {
    const plugins: Set<string> = new Set();
    const actions: GatsbyActions['actions'] = { setBabelPlugin: plugin => plugins.add(plugin.name) };
    const _config = config as GatsbyNode;
    if (typeof _config.onCreateBabelConfig === 'function') {
      _config.onCreateBabelConfig({ actions });
    }
    return Array.from(plugins);
  }

  return [];
};

export const findDependencies = timerify(findGatsbyDependencies);
