import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { clientToPackages } from './helpers.ts';
import type { KnexConfig } from './types.ts';

// https://knexjs.org

const title = 'Knex';

const enablers = ['knex'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['knexfile.{js,cjs,mjs,ts,cts,mts}'];

const processKnexConfig = (config: KnexConfig): Input[] => {
  const inputs: Input[] = [];
  if (config.client) {
    const packages = clientToPackages(config.client);
    inputs.push(...packages.map(pkg => toDependency(pkg, { optional: true })));
  }
  if (config.migrations?.directory) {
    const dirs = Array.isArray(config.migrations.directory)
      ? config.migrations.directory
      : [config.migrations.directory];
    inputs.push(...dirs.map(dir => toEntry(`${dir}/*.{js,ts}`)));
  }
  if (config.seeds?.directory) {
    const dirs = Array.isArray(config.seeds.directory) ? config.seeds.directory : [config.seeds.directory];
    inputs.push(...dirs.map(dir => toEntry(`${dir}/*.{js,ts}`)));
  }
  return inputs;
};

const resolveConfig: ResolveConfig<KnexConfig | Record<string, KnexConfig>> = config => {
  const configs =
    'client' in config && config.client ? [config as KnexConfig] : Object.values(config as Record<string, KnexConfig>);

  return configs.flatMap(cfg => (typeof cfg === 'object' && cfg !== null ? processKnexConfig(cfg) : []));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
