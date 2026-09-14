import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toFilterRuleDependency, toPluginDependency, toRuleDependency } from './helpers.ts';
import type { TextlintConfig } from './types.ts';

// https://textlint.org/docs/configuring
// https://textlint.org/docs/cli

const title = 'textlint';

const enablers = ['textlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'textlint';

const config = ['package.json', '.textlintrc', '.textlintrc.{json,yaml,yml,js,cjs}'];

const resolveConfig: ResolveConfig<TextlintConfig> = (config, { manifest }) => {
  const inputs: Input[] = [];
  for (const [key, options] of Object.entries(config.rules ?? {})) {
    if (options) inputs.push(toRuleDependency(key, manifest));
  }
  for (const key of Object.keys(config.filters ?? {})) inputs.push(toFilterRuleDependency(key, manifest));
  const plugins = Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins ?? {});
  for (const key of plugins) inputs.push(toPluginDependency(key, manifest));
  return inputs;
};

const args: Args = {
  config: true,
  string: ['rule', 'preset', 'plugin'],
  resolveInputs: (parsed, { manifest }) => {
    const inputs: Input[] = [];
    for (const rule of [parsed.rule ?? []].flat()) inputs.push(toRuleDependency(String(rule), manifest));
    for (const preset of [parsed.preset ?? []].flat()) {
      const key = String(preset);
      inputs.push(toRuleDependency(key.includes('preset-') ? key : `preset-${key}`, manifest));
    }
    for (const plugin of [parsed.plugin ?? []].flat()) inputs.push(toPluginDependency(String(plugin), manifest));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
};

export default plugin;
