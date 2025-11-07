import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { MdxlintConfig } from './types.js';

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
      .map(plugin => (isInternal(plugin) ? plugin : plugin.startsWith('remark-') || plugin.startsWith('mdxlint-') ? plugin : `mdxlint-${plugin}`)) ?? [];
  return plugins.map(id => toDeferResolve(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
