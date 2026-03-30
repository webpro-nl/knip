import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toC12config } from '../../util/plugin-config.ts';

// https://heyapi.dev/openapi-ts/configuration

const title = 'openapi-ts';

const enablers = ['@hey-api/openapi-ts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toC12config('openapi-ts')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
