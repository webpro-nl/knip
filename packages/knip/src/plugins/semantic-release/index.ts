import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toDeferResolve } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { SemanticReleaseConfig } from './types.ts';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file
// https://github.com/semantic-release/semantic-release/blob/v25.0.9/lib/get-config.js
// https://github.com/semantic-release/semantic-release/blob/v25.0.9/cli.js

const title = 'Semantic Release';

const enablers = ['semantic-release'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const packageJsonPath = 'release';

const config = ['package.json', ...toCosmiconfig('release')];

const excludePackages = [
  '@semantic-release/commit-analyzer',
  '@semantic-release/github',
  '@semantic-release/npm',
  '@semantic-release/release-notes-generator',
];

const resolveConfig: ResolveConfig<SemanticReleaseConfig> = (config, options) => {
  const inputs: Input[] = [];
  for (const id of [config?.extends ?? []].flat()) {
    if (isInternal(id)) inputs.push(toConfig('semantic-release', id, { containingFilePath: options.configFilePath }));
    else inputs.push(toDeferResolve(id));
  }
  const plugins = (config?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
  for (const id of plugins.filter(plugin => !excludePackages.includes(plugin))) inputs.push(toDeferResolve(id));
  return inputs;
};

const args: Args = {
  alias: { extends: ['e'] },
  resolveInputs: (parsed, { cwd }) => {
    if (parsed.extends === 'false') return [];
    const inputs: Input[] = [];
    for (const value of [parsed.extends ?? []].flat()) {
      for (const part of String(value).split(',')) {
        const id = part.trim();
        if (isInternal(id)) inputs.push(toConfig('semantic-release', id, { dir: cwd }));
        else inputs.push(toDeferResolve(id));
      }
    }
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  packageJsonPath,
  config,
  resolveConfig,
  args,
};

export default plugin;
