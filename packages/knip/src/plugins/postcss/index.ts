import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency, toLilconfig } from '#p/util/plugin.js';
import type { PostCSSConfig } from './types.js';

// https://github.com/postcss/postcss-load-config/blob/main/src/index.js#L110
// Additionally postcss.config.json is loaded by nextjs

const title = 'PostCSS';

const enablers = ['postcss', 'postcss-cli', 'next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.json',
  'postcss.config.json',
  ...toLilconfig('postcss', { configDir: false, additionalExtensions: ['ts', 'mts', 'cts', 'yaml', 'yml'] }),
];

const resolveConfig: ResolveConfig<PostCSSConfig> = config => {
  const plugins = config.plugins
    ? (Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins)).flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
    : [];

  // Because postcss is not included in peerDependencies of tailwindcss
  return plugins.includes('tailwindcss') ? [...plugins, 'postcss'] : plugins;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
