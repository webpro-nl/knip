import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { CucumberConfig } from './types.js';

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
  return imports.concat([...formatters, ...requires].map(toDeferResolve));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
} satisfies Plugin;
