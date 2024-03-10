import { isInternal } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import { isConfigurationOutput } from './types.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { ConfiguredPlugin, GraphqlCodegenTypes, PresetNames } from './types.js';

// https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config
// https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/config.ts

const title = 'GraphQL Codegen';

const enablers = [/^@graphql-codegen\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'codegen';

const config = [
  'codegen.{json,yml,yaml,js,ts,mjs,cts}',
  '.codegenrc.{json,yml,yaml,js,ts}',
  'codegen.config.js',
  'package.json',
];

const resolveConfig: ResolveConfig<GraphqlCodegenTypes> = config => {
  const generateSet = Object.values(config.generates);

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
} as const;
