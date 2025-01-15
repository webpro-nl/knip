import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
import type { CommitLintConfig } from './types.js';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config
// https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/load/src/utils/load-config.ts

const title = 'commitlint';

const enablers = ['@commitlint/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', 'package.yaml', ...toCosmiconfig('commitlint', { additionalExtensions: ['cts'] })];

const resolveConfig: ResolveConfig<CommitLintConfig> = async config => {
  const extendsConfigs = config.extends
    ? [config.extends]
        .flat()
        .map(id => (id.startsWith('@') || id.startsWith('commitlint-config-') ? id : `commitlint-config-${id}`))
    : [];
  const plugins = config.plugins ? [config.plugins].flat().filter(s => typeof s === 'string') : [];
  const formatter = config.formatter ? [config.formatter] : [];
  const parserPreset = await config.parserPreset;
  const parserPresetPaths: string[] = parserPreset
    ? typeof parserPreset === 'string'
      ? [parserPreset]
      : parserPreset.path
        ? [parserPreset.path ?? parserPreset]
        : []
    : [];
  return [...extendsConfigs, ...plugins, ...formatter, ...parserPresetPaths].map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
