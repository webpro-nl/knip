import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CucumberConfig } from './types.ts';

// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md

const title = 'Cucumber';

const enablers = ['@cucumber/cucumber'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['cucumber.{json,yaml,yml,js,cjs,mjs}'];

const entry = ['features/**/*.@(js|cjs|mjs)'];

const resolveConfig: ResolveConfig<CucumberConfig> = config => {
  const imports = (config?.import ? config.import : entry).map(id => toEntry(id));
  const formatters = config?.format ? config.format : [];
  const requires = config?.require ? config.require : [];
  return imports.concat([...formatters, ...requires].map(id => toDeferResolve(id)));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
};

export default plugin;
