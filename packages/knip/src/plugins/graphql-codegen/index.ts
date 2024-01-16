import { basename, isInternal } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { isConfigurationOutput } from './types.js';
import type { ConfiguredPlugin, GraphqlCodegenTypes, PresetNames } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config
// https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/src/config.ts

const NAME = 'GraphQL Codegen';

const ENABLERS = [/^@graphql-codegen\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'codegen';

const CONFIG_FILE_PATTERNS = [
  'codegen.{json,yml,yaml,js,ts,mjs,cts}',
  '.codegenrc.{json,yml,yaml,js,ts}',
  'codegen.config.js',
  'package.json',
];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: GraphqlCodegenTypes | undefined =
    basename(configFilePath) === 'package.json' ? manifest[PACKAGE_JSON_PATH] : await load(configFilePath);

  if (!localConfig) return [];

  const generateSet = Object.values(localConfig.generates);

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

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
