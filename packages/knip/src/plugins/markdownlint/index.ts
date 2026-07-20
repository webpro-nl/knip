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

const isBundled = (specifier: string) =>
  specifier.startsWith('markdownlint/style/') || specifier === 'markdownlint-cli2-formatter-default';

const config = ['.markdownlint-cli2.{jsonc,yaml,cjs,mjs}', '.markdownlint.{json,jsonc,yaml,yml,cjs,mjs}'];

const resolveConfig: ResolveConfig<MarkdownlintConfig> = (config, options) => {
  const { manifest } = options;
  const dependencies: string[] = [];
  for (const extend of [config?.extends, config?.config?.extends]) {
    if (extend) dependencies.push(extend);
  }
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
    .filter(script => script.includes('markdownlint ') || script.includes('markdownlint-cli2 '))
    .flatMap(script => getArgumentValues(script, / (--rules|-r)[ =]([^ ]+)/g));
  return [...dependencies, ...uses].filter(id => !isBundled(id)).map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
