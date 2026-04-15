import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PluginConfig } from './types.ts';

// https://www.serverless.com/framework/docs

const title = 'Serverless Framework';

const enablers = ['serverless'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['serverless.{yml,yaml}'];

const handlerToEntry = (handler: string) => {
  const dot = handler.lastIndexOf('.');
  return toProductionEntry(`${handler.slice(0, dot)}.{js,ts}`);
};

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  if (!config.functions) return [];
  return Object.values(config.functions).map(fn => handlerToEntry(fn.handler));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
