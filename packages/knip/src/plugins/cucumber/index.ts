import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toModule, toEntry } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { isDirectory } from '../../util/fs.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CucumberConfig, Format } from './types.ts';

// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
// https://github.com/cucumber/cucumber-js/blob/main/docs/transpiling.md

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

const toSupportEntry = (id: string, cwd: string, extension: string) =>
  toEntry(isDirectory(cwd, id) ? `${id}/**/*${extension}` : id);

const resolveProfile = (cwd: string, config?: CucumberConfig) => {
  const imports = (config?.import ? config.import : entry).map(id => toSupportEntry(id, cwd, '.@(js|cjs|mjs)'));
  const requires = (config?.require ? config.require : []).map(id => toSupportEntry(id, cwd, '.js'));
  const modules = (config?.requireModule ? config.requireModule : []).map(id => toModule(id));
  const formatters = (config?.format ? config.format : [])
    .map(toFormatterName)
    .filter(name => !builtinFormatters.has(name))
    .map(id => toModule(id));
  return [...imports, ...requires, ...modules, ...formatters];
};

const resolveConfig: ResolveConfig<CucumberConfig | Record<string, CucumberConfig> | string> = (config, options) => {
  if (typeof config !== 'object' || config === null) return resolveProfile(options.cwd);
  const isProfiles = /\.(json|ya?ml)$/.test(options.configFileName) || 'default' in config;
  if (!isProfiles) return resolveProfile(options.cwd, config);
  const profiles = 'default' in config ? Object.values(config) : [undefined, ...Object.values(config)];
  return profiles.flatMap(profile => resolveProfile(options.cwd, profile));
};

const args = {
  binaries: ['cucumber-js'],
  config: true,
  resolve: ['require-module'],
  string: ['require'],
  alias: { require: ['r'] },
  resolveInputs: (parsed: ParsedArgs, { cwd }: { cwd: string }) =>
    [parsed.require ?? []].flat().map(id => toSupportEntry(id, cwd, '.js')),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
};

export default plugin;
