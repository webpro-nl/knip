import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.js';
import type ts from 'typescript';
import { type Input, toDependency, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { KnexConfig } from './types.js';
import { clientToPackages, getKnexClients } from './helpers.js';

// https://knexjs.org/guide/

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
  if ('client' in config && config.client) {
    return processKnexConfig(config as KnexConfig);
  }

  const inputs: Input[] = [];
  const envConfigs = config as Record<string, KnexConfig>;
  for (const key in envConfigs) {
    const envConfig = envConfigs[key];
    if (typeof envConfig === 'object' && envConfig !== null) {
      inputs.push(...processKnexConfig(envConfig));
    }
  }
  return inputs;
};

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  const clients = getKnexClients(sourceFile);
  const packages = clients.flatMap(client => clientToPackages(client));
  const uniquePackages = [...new Set(packages)];
  return uniquePackages.map(pkg => toDependency(pkg, { optional: true }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolveFromAST,
};

export default plugin;
