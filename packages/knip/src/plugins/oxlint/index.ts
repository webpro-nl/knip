import { Visitor } from 'oxc-parser';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toDependency, toEntry } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { OxlintConfig } from './types.ts';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint', 'vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.json', 'oxlint.config.ts', 'vite.config.{js,mjs,ts,cjs,mts,cts}'];

const isViteConfig = (configFileName: string) => configFileName.startsWith('vite.config.');

const args = {
  config: true,
};

const resolveJsPlugins = (jsPlugins: OxlintConfig['jsPlugins']): Input[] => {
  const inputs: Input[] = [];
  for (const plugin of jsPlugins ?? []) {
    const specifier = typeof plugin === 'string' ? plugin : plugin.specifier;
    if (!isInternal(specifier)) inputs.push(toDependency(specifier));
    else inputs.push(toEntry(specifier));
  }
  return inputs;
};

const isLoadConfig: IsLoadConfig = ({ configFileName }) => !isViteConfig(configFileName);

const resolveConfig: ResolveConfig<OxlintConfig> = config => {
  const inputs = resolveJsPlugins(config.jsPlugins);
  for (const override of config.overrides ?? []) {
    for (const input of resolveJsPlugins(override.jsPlugins)) inputs.push(input);
  }
  return inputs;
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  if (!isViteConfig(options.configFileName)) return [];
  const jsPlugins = new Set<string>();
  const visitor = new Visitor({
    ObjectExpression(node) {
      const lint = findProperty(node, 'lint');
      if (lint?.type === 'ObjectExpression')
        for (const specifier of getPropertyValues(lint, 'jsPlugins')) jsPlugins.add(specifier);
    },
  });
  visitor.visit(program);
  return resolveJsPlugins([...jsPlugins]);
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
