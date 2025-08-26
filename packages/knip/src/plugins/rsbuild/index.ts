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
    for (const entry of Object.values(config.source.entry)) {
      if (typeof entry === 'string') inputs.add(toEntry(entry));
      else if (Array.isArray(entry)) for (const e of entry) inputs.add(toEntry(e));
      else {
        if (typeof entry.import === 'string') inputs.add(toEntry(entry.import));
        else if (Array.isArray(entry.import)) for (const e of entry.import) inputs.add(toEntry(e));
      }
    }
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
