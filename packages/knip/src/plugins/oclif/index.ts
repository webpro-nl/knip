import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { OclifConfig } from './types.ts';

// https://oclif.io/docs/configuring_your_cli

const title = 'oclif';

const enablers = ['oclif', '@oclif/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const production = ['{,src/}commands/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'];

const resolveConfig: ResolveConfig<OclifConfig> = async config => {
  if (!config) return [];
  const inputs: Input[] = production.map(id => toProductionEntry(id));
  for (const id of [...(config.plugins ?? []), ...(config.devPlugins ?? [])]) inputs.push(toDependency(id));
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
