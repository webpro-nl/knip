import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { PostCSSConfig } from './types.js';

const title = 'PostCSS';

const enablers = ['postcss', 'postcss-cli', 'next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['postcss.config.{cjs,js}', 'postcss.config.json', 'package.json'];

const resolveConfig: ResolveConfig<PostCSSConfig> = config => {
  return config.plugins
    ? (Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins)).flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
    : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
