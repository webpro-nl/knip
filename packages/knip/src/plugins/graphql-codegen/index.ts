import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency, toEntry, toProductionEntry } from '../../util/input.ts';
import { get } from '../../util/object.ts';
import { isInternal, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type {
  ConfiguredPlugin,
  GraphqlCodegenTypes,
  GraphqlConfigTypes,
  GraphqlProjectsConfigTypes,
  PresetNames,
} from './types.ts';
import { isConfigurationOutput, isGraphqlConfigTypes, isGraphqlProjectsConfigTypes } from './types.ts';

// Both use Cosmiconfig with custom searchPlaces - not using helper as a result
// Codegen:
// https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config
// https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/config.ts
// Config:
// https://the-guild.dev/graphql/config/docs/user/usage#config-search-places

const title = 'GraphQL Codegen';

const enablers = [/^@graphql-codegen\//, 'graphql-config'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const args = {
  config: true,
};

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

// https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/plugins.ts#L8-L18
const getPluginPackageName = (name: string) => {
  if (name.startsWith('@') || name.includes('codegen-')) return name;
  return `@graphql-codegen/${name}`;
};

const resolveConfig: ResolveConfig<GraphqlCodegenTypes | GraphqlConfigTypes | GraphqlProjectsConfigTypes> = (
  config,
  options
) => {
  const codegenConfigs = isGraphqlProjectsConfigTypes(config)
    ? Object.values(config.projects).flatMap(project => project.extensions?.codegen ?? [])
    : isGraphqlConfigTypes(config)
      ? [config.extensions?.codegen]
      : [config];
  const generateConfigs = codegenConfigs.filter((config): config is GraphqlCodegenTypes => Boolean(config?.generates));
  const generateSet = generateConfigs.flatMap(config => Object.values(config.generates));

  const outputs = generateConfigs
    .flatMap(config => Object.keys(config.generates))
    .map(output => toProductionEntry(join(options.configFileDir, output.endsWith('/') ? `${output}**` : output)));

  const configurationOutput = generateSet.filter(isConfigurationOutput);

  const presets = configurationOutput
    .map(configOutput => (configOutput.preset ? configOutput.preset : undefined))
    .filter((preset): preset is PresetNames => typeof preset === 'string')
    .map(presetName =>
      // https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/presets.ts#L8-L11
      presetName.startsWith('@graphql-codegen/')
        ? presetName
        : `@graphql-codegen/${presetName}${presetName.endsWith('-preset') ? '' : '-preset'}`
    );

  const flatPlugins = generateSet
    .filter((config): config is ConfiguredPlugin => !isConfigurationOutput(config))
    .flatMap(item => Object.keys(item))
    .map(plugin => getPluginPackageName(plugin));

  const nestedPlugins = configurationOutput
    .flatMap(configOutput => (configOutput.plugins ? configOutput.plugins : []))
    .flatMap(plugin => {
      if (typeof plugin === 'object') return Object.keys(plugin);
      return [plugin];
    })
    .flatMap(plugin => {
      if (typeof plugin !== 'string') return [];
      if (isInternal(plugin)) return [toEntry(plugin)];
      return [toDependency(getPluginPackageName(plugin))];
    });

  return [...presets, ...flatPlugins, ...nestedPlugins, ...outputs].map(id =>
    typeof id === 'string' ? toDependency(id) : id
  );
};

const plugin: Plugin = {
  title,
  args,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
