import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RemarkConfig } from './types.ts';

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
      .map(plugin => (isInternal(plugin) ? plugin : plugin.startsWith('remark-') ? plugin : `remark-${plugin}`)) ?? [];
  return plugins.map(id => toDeferResolve(id));
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
