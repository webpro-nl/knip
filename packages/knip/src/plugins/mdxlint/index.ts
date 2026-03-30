import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MdxlintConfig } from './types.ts';

// https://github.com/remcohaszing/mdxlint

const title = 'mdxlint';

const enablers = ['mdxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mdxlintrc', '.mdxlintrc.{json,js,cjs,mjs,yml,yaml}', 'package.json'];

const resolveConfig: ResolveConfig<MdxlintConfig> = config => {
  const plugins =
    config.plugins
      ?.flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
      .map(plugin =>
        isInternal(plugin)
          ? plugin
          : plugin.startsWith('remark-') || plugin.startsWith('mdxlint-')
            ? plugin
            : `remark-${plugin}`
      ) ?? [];
  return plugins.map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
