import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { get } from '#p/util/object.js';
import { isInternal } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type {
  ConfiguredPlugin,
  GraphqlCodegenTypes,
  GraphqlConfigTypes,
  GraphqlProjectsConfigTypes,
  PresetNames,
} from './types.js';
import { isConfigurationOutput, isGraphqlConfigTypes, isGraphqlProjectsConfigTypes } from './types.js';

// Both use Cosmiconfig with custom searchPlaces - not using helper as a result
// Codegen:
// https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config
// https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/config.ts
// Config:
// https://the-guild.dev/graphql/config/docs/user/usage#config-search-places

const title = 'GraphQL Codegen';

const enablers = [/^@graphql-codegen\//, 'graphql-config'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath: Plugin['packageJsonPath'] = manifest => get(manifest, 'codegen') ?? get(manifest, 'graphql');

const config = [
  'package.json',
  // graphql-codegen config files
  'codegen.{json,yml,yaml,js,ts}',
  '.codegenrc.{json,yml,yaml,js,ts}',
  'codegen.config.js',
  // graphql-config config files
  '.graphqlrc',
  '.graphqlrc.{json,yml,yaml,toml,js,ts}',
  'graphql.config.{json,yml,yaml,toml,js,cjs,ts}',
];

const resolveConfig: ResolveConfig<GraphqlCodegenTypes | GraphqlConfigTypes | GraphqlProjectsConfigTypes> = config => {
  const codegenConfigs = isGraphqlProjectsConfigTypes(config)
    ? Object.values(config.projects).flatMap(project => project.extensions?.codegen ?? [])
    : isGraphqlConfigTypes(config)
      ? [config.extensions?.codegen]
      : [config];
  const generateSet = codegenConfigs
    .filter((config): config is GraphqlCodegenTypes => Boolean(config?.generates))
    .flatMap(config => Object.values(config.generates));

  const configurationOutput = generateSet.filter(isConfigurationOutput);

  const presets = configurationOutput
    .map(configOutput => (configOutput.preset ? configOutput.preset : undefined))
    .filter((preset): preset is PresetNames => typeof preset === 'string')
    .map(presetName => `@graphql-codegen/${presetName}${presetName.endsWith('-preset') ? '' : '-preset'}`);

  const flatPlugins = generateSet
    .filter((config): config is ConfiguredPlugin => !isConfigurationOutput(config))
    .flatMap(item => Object.keys(item))
    .map(plugin => `@graphql-codegen/${plugin}`);

  const nestedPlugins = configurationOutput
    .flatMap(configOutput => (configOutput.plugins ? configOutput.plugins : []))
    .flatMap(plugin => {
      if (typeof plugin === 'object') return Object.keys(plugin);
      return [plugin];
    })
    .flatMap(plugin => {
      if (typeof plugin !== 'string') return [];
      if (isInternal(plugin)) return [toEntryPattern(plugin)];
      return [`@graphql-codegen/${plugin}`];
    });

  return [...presets, ...flatPlugins, ...nestedPlugins];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
