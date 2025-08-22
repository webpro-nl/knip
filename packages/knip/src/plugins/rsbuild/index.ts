import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { RsbuildConfig } from './types.js';

// https://rsbuild.rs/config/

const title = 'Rsbuild';

const enablers = ['@rsbuild/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<RsbuildConfig> = async config => {
  const inputs = new Set<Input>();
  if (config.source?.entry) {
    if (Array.isArray(config.source.entry)) for (const entry of config.source.entry) inputs.add(toEntry(entry));
    if (typeof config.source.entry === 'string') inputs.add(toEntry(config.source.entry));
  }
  return Array.from(inputs);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
