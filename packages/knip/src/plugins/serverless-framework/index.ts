import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://www.serverless.com/framework/docs

const title = 'serverless-framework';

const enablers = ['serverless', 'sls'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['serverless.yml'];

const production: string[] = [];

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const functions = Object.keys(config.functions);

  return [...functions].map(id => convertHandlerToFileToProductionEntry(config.functions[id].handler));
};

const convertHandlerToFileToProductionEntry = (handler: string) => {
  const lastIndexOfDot = handler.lastIndexOf('.');
  const file = `${handler.substring(0, lastIndexOfDot)}.{js,ts}`;
  return toProductionEntry(file)
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
};

export default plugin;
