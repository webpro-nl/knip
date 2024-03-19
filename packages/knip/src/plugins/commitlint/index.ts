import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config

type CommitLintConfig = {
  extends: string[];
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
  return config.extends ? [config.extends].flat() : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
