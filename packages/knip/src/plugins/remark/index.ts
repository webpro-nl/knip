import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RemarkConfig } from './types.ts';
import { resolveLoadPluginStylePluginName } from './helpers.ts';

// https://github.com/remarkjs/remark/blob/main/packages/remark-cli/readme.md

const title = 'Remark';

const enablers = ['remark-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'remarkConfig';

const config = ['package.json', '.remarkrc', '.remarkrc.json', '.remarkrc.{js,cjs,mjs}', '.remarkrc.{yml,yaml}'];

const resolveConfig: ResolveConfig<RemarkConfig> = (config, options) => {
  const plugins =
    config.plugins
      ?.flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
      .map(plugin =>
        // Resolve a remark plugin specifier from all possible dependency name variations.
        //
        // remark-cli configures `pluginPrefix: 'remark'`; unified-engine forwards this
        // to load-plugin, which prefers the prefixed name and falls back to the raw
        // identifier + supports scoped modules.
        //
        // https://github.com/remarkjs/remark/blob/334415d7552f2ffa359a23efc100345e7ed7a9f7/packages/remark-cli/cli.js#L36
        // https://github.com/unifiedjs/unified-engine/blob/6f35eaedc659e6edd5392f9ef0cf49bc51f3feab/lib/configuration.js#L423-L426
        // https://github.com/wooorm/load-plugin/blob/4a1b7231e20f64be52625ff3469bbf111dda5949/lib/index.js#L91-L101
        resolveLoadPluginStylePluginName('remark-', plugin, options.manifest)
      ) ?? [];
  return plugins;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
