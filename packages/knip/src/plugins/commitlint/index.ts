import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config

type CommitLintConfig = {
  extends: string[];
  plugins: string[];
};

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
  const extendsConfigs = config.extends ? [config.extends].flat() : [];
  const plugins = config.plugins ? [config.plugins].flat() : [];
  return [...extendsConfigs, ...plugins];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
