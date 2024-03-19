import { hasDependency } from '#p/util/plugin.js';
import { getArgumentValues } from './helpers.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { MarkdownlintConfig } from './types.js';

// https://github.com/igorshubovych/markdownlint-cli

const title = 'markdownlint';

const enablers = ['markdownlint-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.markdownlint.{json,jsonc}', '.markdownlint.{yml,yaml}'];

const resolveConfig: ResolveConfig<MarkdownlintConfig> = (config, options) => {
  const { manifest } = options;
  const extend = config?.extends ? [config.extends] : [];
  const scripts = manifest?.scripts
    ? Object.values(manifest.scripts).filter((script): script is string => typeof script === 'string')
    : [];
  const uses = scripts
    .filter(script => script.includes('markdownlint '))
    .flatMap(script => getArgumentValues(script, / (--rules|-r)[ =]([^ ]+)/g));
  return [...extend, ...uses];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
