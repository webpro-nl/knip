import { Visitor } from 'oxc-parser';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toConfig, toDependency, toEntry } from '../../util/input.ts';
import { dirname, isInternal, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputsFromSettings } from '../eslint/helpers.ts';
import { getInputsFromSettingsAST } from '../eslint/resolveFromAST.ts';
import type { OxlintConfig } from './types.ts';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint', 'vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.{json,jsonc}', 'oxlint.config.{ts,mts}', 'vite.config.{js,mjs,ts,cjs,mts,cts}'];

const isViteConfig = (configFileName: string) => configFileName.startsWith('vite.config.');

const args = {
  config: true,
};

const resolveJsPlugins = (jsPlugins: OxlintConfig['jsPlugins'], configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  const dir = dirname(configFilePath);
  for (const plugin of jsPlugins ?? []) {
    const specifier = typeof plugin === 'string' ? plugin : plugin.specifier;
    if (!isInternal(specifier)) inputs.push(toDependency(specifier));
    else inputs.push(toEntry(toAbsolute(specifier, dir)));
  }
  return inputs;
};

const isLoadConfig: IsLoadConfig = ({ configFileName }) => !isViteConfig(configFileName);

const resolveExtendedConfig = (config: OxlintConfig, configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  for (const entry of config.extends ?? []) {
    if (typeof entry === 'string') {
      const filePath = toAbsolute(entry, dirname(configFilePath));
      inputs.push(toConfig('oxlint', filePath, { containingFilePath: configFilePath }));
    } else {
      for (const input of resolveExtendedConfig(entry, configFilePath)) inputs.push(input);
    }
  }
  for (const input of resolveJsPlugins(config.jsPlugins, configFilePath)) inputs.push(input);
  for (const override of config.overrides ?? []) {
    for (const input of resolveJsPlugins(override.jsPlugins, configFilePath)) inputs.push(input);
  }
  for (const input of getInputsFromSettings(config.settings)) inputs.push(input);
  return inputs;
};

const resolveConfig: ResolveConfig<OxlintConfig> = (config, options) =>
  resolveExtendedConfig(config, options.configFilePath);

const resolveFromAST: ResolveFromAST = (program, options) => {
  if (!isViteConfig(options.configFileName)) return [];
  const jsPlugins = new Set<string>();
  const visitor = new Visitor({
    ObjectExpression(node) {
      const lint = findProperty(node, 'lint');
      if (lint?.type !== 'ObjectExpression') return;
      for (const specifier of getPropertyValues(lint, 'jsPlugins')) jsPlugins.add(specifier);
      for (const plugin of findProperty(lint, 'jsPlugins')?.elements ?? []) {
        if (plugin?.type !== 'ObjectExpression') continue;
        for (const specifier of getPropertyValues(plugin, 'specifier')) jsPlugins.add(specifier);
      }
    },
  });
  visitor.visit(program);
  return [...resolveJsPlugins([...jsPlugins], options.configFilePath), ...getInputsFromSettingsAST(program)];
};

const isFilterTransitiveDependencies = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  isFilterTransitiveDependencies,
  args,
};

export default plugin;
