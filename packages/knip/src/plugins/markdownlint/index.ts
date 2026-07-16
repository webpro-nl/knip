import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getArgumentValues } from './helpers.ts';
import type { MarkdownlintConfig } from './types.ts';

// https://github.com/igorshubovych/markdownlint-cli
// https://github.com/DavidAnson/markdownlint-cli2

const title = 'markdownlint';

const enablers = ['markdownlint-cli', 'markdownlint-cli2'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.markdownlint-cli2.{jsonc,yaml,cjs,mjs}', '.markdownlint.{json,jsonc,yaml,yml,cjs,mjs}'];

const resolveConfig: ResolveConfig<MarkdownlintConfig> = (config, options) => {
  const { manifest } = options;
  const dependencies: string[] = [];
  if (config?.extends) dependencies.push(config.extends);
  if (config?.config?.extends) dependencies.push(config.config.extends);
  for (const customRule of config?.customRules ?? []) {
    if (typeof customRule === 'string') dependencies.push(customRule);
    else if (Array.isArray(customRule)) {
      for (const rule of customRule) {
        if (typeof rule === 'string') dependencies.push(rule);
      }
    }
  }
  for (const modules of [config?.markdownItPlugins, config?.outputFormatters]) {
    for (const module of modules ?? []) {
      if (Array.isArray(module) && typeof module[0] === 'string') dependencies.push(module[0]);
    }
  }
  const scripts = manifest?.scripts
    ? Object.values(manifest.scripts).filter((script): script is string => typeof script === 'string')
    : [];
  const uses = scripts
    .filter(script => script.includes('markdownlint '))
    .flatMap(script => getArgumentValues(script, / (--rules|-r)[ =]([^ ]+)/g));
  return [...dependencies, ...uses].map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
