import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { AwsCdkConfig } from './types.ts';

// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html

const title = 'aws-cdk';

const enablers = ['aws-cdk'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['{src/,cdk/,}bin/**/*.{js,ts}', '{src/,cdk/,}test/**/*.{js,ts}'];

const production = ['{src/,cdk/,}lib/**/*.{js,ts}'];

const config = ['cdk.json'];

const resolveConfig: ResolveConfig<AwsCdkConfig> = async (config, options) => {
  if (!config) return [];

  const app = options.getInputsFromScripts(config.app, { knownBinsOnly: true });
  const context = (Object.keys(config.context ?? {}).map(key => key.split('/')[0]) ?? []).map(id => toDependency(id));
  const entries = entry.map(id => toEntry(id));
  const productionEntries = production.map(id => toProductionEntry(id));
  return compact([...app, ...context, ...entries, ...productionEntries]);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  production,
} satisfies Plugin;
