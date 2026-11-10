import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toDependency } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MdxlintConfig } from './types.ts';

// https://github.com/remcohaszing/mdxlint

const title = 'mdxlint';

const enablers = ['mdxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mdxlintrc', '.mdxlintrc.{json,js,cjs,mjs,yml,yaml}', 'package.json'];

const isPrefixed = (name: string) => name.startsWith('remark-') || name.startsWith('mdxlint-');

const toPluginName = (plugin: string) => {
  const slash = plugin.startsWith('@') ? plugin.indexOf('/') + 1 : 0;
  const name = plugin.slice(slash);
  return isPrefixed(name) ? plugin : `${plugin.slice(0, slash)}remark-${name}`;
};

const resolveConfig: ResolveConfig<MdxlintConfig> = config => {
  const inputs: Input[] = [];
  for (const plugin of config.plugins ?? []) {
    const id = typeof plugin === 'string' ? plugin : Array.isArray(plugin) ? plugin[0] : undefined;
    if (typeof id !== 'string') continue;
    if (isInternal(id)) inputs.push(toDeferResolve(id));
    else inputs.push(toDependency(toPluginName(id)));
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
