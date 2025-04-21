import { toDependency } from 'src/util/input.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { hasDependency } from '../../util/plugin.js';
import type { AwsCdkConfig } from './types.ts';

// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html

const title = 'aws-cdk';

const enablers = ['aws-cdk'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ["cdk.json"];

const resolveConfig: ResolveConfig<AwsCdkConfig> = async (config, options) => {
  if (!config) return [];

  const app = options.getInputsFromScripts(config.app, { knownBinsOnly: true });
  const context = Object.keys(config.context ?? {}).map(key => key.split("/")[0]) ?? [];
  return compact([...app, ...context]).map(id => (typeof id === 'string' ? toDependency(id) : id));
};

const production: string[] = [
  '{src/,cdk/,}bin/**/*.{js,ts}',
  '{src/,cdk/,}lib/**/*.{js,ts}',
  '{src/,cdk/,}test/**/*.{js,ts}',
];

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  production,
} satisfies Plugin;
