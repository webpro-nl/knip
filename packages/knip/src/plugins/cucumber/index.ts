import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CucumberConfig, Format } from './types.ts';

// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md

const title = 'Cucumber';

const enablers = ['@cucumber/cucumber'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['cucumber.{json,yaml,yml,js,cjs,mjs}'];

const entry = ['features/**/*.@(js|cjs|mjs)'];

const builtinFormatters = new Set([
  'html',
  'json',
  'junit',
  'message',
  'pretty',
  'progress',
  'progress-bar',
  'rerun',
  'snippets',
  'summary',
  'usage',
  'usage-json',
]);

const toFormatterName = (format: Format) => {
  if (Array.isArray(format)) return format[0];
  // "name:target" where either side may be wrapped in double quotes
  const [name, quotedName] = format.match(/^"([^"]*)"|^[^:]*/) ?? [format];
  return quotedName ?? name;
};

const resolveProfile = (config?: CucumberConfig) => {
  const imports = (config?.import ? config.import : entry).map(id => toEntry(id));
  const requires = (config?.require ? config.require : []).map(id => toEntry(id));
  const formatters = (config?.format ? config.format : [])
    .map(toFormatterName)
    .filter(name => !builtinFormatters.has(name))
    .map(id => toDeferResolve(id));
  return [...imports, ...requires, ...formatters];
};

const resolveConfig: ResolveConfig<CucumberConfig | Record<string, CucumberConfig>> = (config, options) => {
  // Every config file holds named profiles, but an ESM default export arrives here already unwrapped
  const isProfiles = !/\.m?js$/.test(options.configFileName) || 'default' in config;
  const profiles = isProfiles ? Object.values(config) : [config];
  return profiles.flatMap(resolveProfile);
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
