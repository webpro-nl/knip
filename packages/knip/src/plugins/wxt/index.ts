import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { WxtConfig } from './types.ts';

// https://wxt.dev/guide/essentials/entrypoints.html

const title = 'WXT';

const enablers = ['wxt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wxt.config.{js,mjs,ts}'];

const production = ['entrypoints/**/*'];

const resolveConfig: ResolveConfig<WxtConfig> = async localConfig => {
  const inputs: Input[] = [];

  for (const pattern of production) {
    inputs.push(toProductionEntry(pattern));
  }

  for (const id of localConfig?.modules ?? []) {
    if (typeof id === 'string') inputs.push(toDependency(id));
  }

  return inputs;
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
