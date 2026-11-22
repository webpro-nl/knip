import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, RegisterVisitors, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toEntry, toDependency } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { clientToPackages } from './helpers.ts';
import type { KnexConfig } from './types.ts';
import { createKnexClientVisitor } from './visitors/clientCall.ts';

// https://knexjs.org

const title = 'Knex';

const enablers = ['knex'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['knexfile.{js,cjs,mjs,ts,cts,mts}'];

const processKnexConfig = (config: KnexConfig, dir: string): Input[] => {
  const inputs: Input[] = [];
  if (config.client) {
    const packages = clientToPackages(config.client);
    inputs.push(...packages.map(pkg => toDependency(pkg, { production: true, optional: true })));
  }
  if (config.migrations?.directory) {
    const dirs = Array.isArray(config.migrations.directory)
      ? config.migrations.directory
      : [config.migrations.directory];
    inputs.push(...dirs.map(directory => toEntry(`${directory}/*.{js,ts}`, { dir })));
  }
  if (config.seeds?.directory) {
    const dirs = Array.isArray(config.seeds.directory) ? config.seeds.directory : [config.seeds.directory];
    inputs.push(...dirs.map(directory => toEntry(`${directory}/*.{js,ts}`, { dir })));
  }
  return inputs;
};

const resolveConfig: ResolveConfig<KnexConfig | Record<string, KnexConfig>> = (config, { configFileDir }) => {
  const configs =
    'client' in config && config.client ? [config as KnexConfig] : Object.values(config as Record<string, KnexConfig>);

  return configs.flatMap(cfg => (typeof cfg === 'object' && cfg !== null ? processKnexConfig(cfg, configFileDir) : []));
};

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createKnexClientVisitor(ctx));
};

const args: Args = {
  string: ['cwd', 'knexfile'],
  resolveInputs: (parsed, { cwd }) =>
    parsed.knexfile ? [toConfig('knex', parsed.knexfile, { dir: parsed.cwd ? toAbsolute(parsed.cwd, cwd) : cwd })] : [],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  registerVisitors,
  args,
};

export default plugin;
