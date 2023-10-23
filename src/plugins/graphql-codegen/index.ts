import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { isConfigurationOutput } from './types.js';
import type { ConfiguredPlugin, GraphqlCodegenTypes, PresetNames } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'Graphql Codegen';

/** @public */
export const ENABLERS = [/^@graphql-codegen\//];

export const PACKAGE_JSON_PATH = 'codegen';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['codegen.{ts,js,json,yml,mjs,cts}', 'package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  // load configuration file from `configFilePath` (or grab `manifest` for package.json)
  // load(FAKE_PATH) will return `undefined`
  const localConfig: GraphqlCodegenTypes | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  if (!localConfig) return [];

  const generateSet = Object.values(localConfig.generates);

  const configurationOutput = generateSet.filter(isConfigurationOutput);

  const presets = configurationOutput
    .map(configOutput => (configOutput.preset ? configOutput.preset : undefined))
    .filter((preset): preset is PresetNames => typeof preset === 'string')
    .map(presetName => `@graphql-codegen/${presetName}${presetName.endsWith('-preset') ? '' : '-preset'}`);

  const flatPlugins = generateSet
    .filter((config): config is ConfiguredPlugin => !isConfigurationOutput(config))
    .map(item => Object.keys(item))
    .flat()
    .map(plugin => `@graphql-codegen/${plugin}`);

  const nestedPlugins = configurationOutput
    .map(configOutput => (configOutput.plugins ? configOutput.plugins : []))
    .flat()
    .map(plugin => `@graphql-codegen/${plugin}`);

  return [...presets, ...flatPlugins, ...nestedPlugins];
};

export const findDependencies = timerify(findPluginDependencies);
