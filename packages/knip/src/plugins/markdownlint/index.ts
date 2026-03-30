import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getArgumentValues } from './helpers.ts';
import type { MarkdownlintConfig } from './types.ts';

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
  return [...extend, ...uses].map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
