import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
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

const resolveConfig: ResolveConfig<TextlintConfig> = (config, { cwd, manifest }) => {
  const inputs: Input[] = [];
  for (const [key, options] of Object.entries(config.rules ?? {})) {
    if (options) inputs.push(toRuleDependency(key, manifest, cwd));
  }
  for (const key of Object.keys(config.filters ?? {})) inputs.push(toFilterRuleDependency(key, manifest, cwd));
  const plugins = Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins ?? {});
  for (const key of plugins) inputs.push(toPluginDependency(key, manifest, cwd));
  return inputs;
};

// `--rule a,b` and repeated flags both load multiple modules
const toList = (value: unknown) =>
  [value ?? []]
    .flat()
    .flatMap(item => String(item).split(','))
    .map(item => item.trim())
    .filter(Boolean);

const args: Args = {
  config: true,
  string: ['rule', 'preset', 'plugin'],
  resolveInputs: (parsed, { cwd, manifest }) => {
    const inputs: Input[] = [];
    for (const rule of toList(parsed.rule)) inputs.push(toRuleDependency(rule, manifest, cwd));
    for (const preset of toList(parsed.preset)) {
      const key = isInternal(preset) || preset.includes('preset-') ? preset : `preset-${preset}`;
      inputs.push(toRuleDependency(key, manifest, cwd));
    }
    for (const plugin of toList(parsed.plugin)) inputs.push(toPluginDependency(plugin, manifest, cwd));
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
