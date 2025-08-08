import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { RemarkConfig } from './types.js';

// https://github.com/remarkjs/remark/blob/main/packages/remark-cli/readme.md

const title = 'Remark';

const enablers = ['remark-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'remarkConfig';

const config = ['package.json', '.remarkrc', '.remarkrc.json', '.remarkrc.{js,cjs,mjs}', '.remarkrc.{yml,yaml}'];

const resolveConfig: ResolveConfig<RemarkConfig> = config => {
  const plugins =
    config.plugins
      ?.flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
      .map(plugin => (plugin.startsWith('remark-') ? plugin : `remark-${plugin}`)) ?? [];
  return plugins.map(id => toDeferResolve(id));
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
