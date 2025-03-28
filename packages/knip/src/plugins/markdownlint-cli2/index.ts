import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { MarkdownlintCli2Config } from './types.js';

// https://github.com/DavidAnson/markdownlint-cli2

const title = 'markdownlint-cli2';

const enablers = ['markdownlint-cli2'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.markdownlint-cli2.{jsonc,yaml,cjs,mjs}'];

const resolveConfig: ResolveConfig<MarkdownlintCli2Config> = (config, options) => {
  const formatters = config?.outputFormatters
      ? [...config.outputFormatters.map(([formatter]) => formatter)] : [];

  return [...formatters].map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
