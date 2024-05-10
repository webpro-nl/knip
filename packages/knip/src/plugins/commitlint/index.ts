import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { CommitLintConfig } from './types.js';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config

const title = 'commitlint';

const enablers = ['@commitlint/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  '.commitlintrc',
  '.commitlintrc.{json,yaml,yml,js,cjs,ts,cts}',
  'commitlint.config.{js,cjs,ts,cts}',
  'package.json',
];

const resolveConfig: ResolveConfig<CommitLintConfig> = config => {
  const extendsConfigs = config.extends
    ? [config.extends]
        .flat()
        .map(id => (id.startsWith('@') || id.startsWith('commitlint-config-') ? id : `commitlint-config-${id}`))
    : [];
  const plugins = config.plugins ? [config.plugins].flat().filter(s => typeof s === 'string') : [];
  const formatter = config.formatter ? [config.formatter] : [];
  const parserPreset = config.parserPreset ? [config.parserPreset] : [];
  return [...extendsConfigs, ...plugins, ...formatter, ...parserPreset];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
