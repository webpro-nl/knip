import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toDependency } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { CommitLintConfig } from './types.ts';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config
// https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/load/src/utils/load-config.ts

const title = 'commitlint';

const enablers = ['@commitlint/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.json',
  'package.yaml',
  ...toCosmiconfig('commitlint', { additionalExtensions: ['cts', 'mts'] }),
];

const toExtendsSpecifier = (id: string) => {
  if (id.startsWith('@')) return id.includes('/') ? id : `${id}/commitlint-config`;
  return id.startsWith('commitlint-config-') ? id : `commitlint-config-${id}`;
};

const resolveConfig: ResolveConfig<CommitLintConfig> = async (config, options) => {
  const inputs: Input[] = [];
  const extendsConfigs: string[] = [];
  for (const id of config.extends ? [config.extends].flat() : []) {
    if (isInternal(id)) inputs.push(toConfig('commitlint', id, { containingFilePath: options.configFilePath }));
    else extendsConfigs.push(toExtendsSpecifier(id));
  }
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
  for (const id of [...extendsConfigs, ...plugins, ...formatter, ...parserPresetPaths]) inputs.push(toDependency(id));
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
