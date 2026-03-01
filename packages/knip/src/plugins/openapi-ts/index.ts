import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toC12config } from '../../util/plugin-config.ts';
import type { OpenApiTsConfig } from './types.ts';

// https://heyapi.dev/openapi-ts/configuration

const title = 'openapi-ts';

const enablers = ['@hey-api/openapi-ts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toC12config('openapi-ts')];

const resolveConfig: ResolveConfig<OpenApiTsConfig> = config => {
  const configs = Array.isArray(config) ? config : [config];
  return configs.flatMap(config =>
    (config.plugins ?? [])
      .map(plugin => (typeof plugin === 'string' ? plugin : plugin.name))
      .filter((name): name is string => typeof name === 'string')
      .map(id => toDependency(id))
  );
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
