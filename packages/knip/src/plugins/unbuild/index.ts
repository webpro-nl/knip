import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { UnbuildConfig } from './types.js';

// https://github.com/unjs/unbuild#unbuild

const title = 'unbuild';

const enablers = ['unbuild'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['build.config.{js,cjs,mjs,ts,mts,cts,json}'];

const resolveConfig: ResolveConfig<UnbuildConfig> = config => {
  return [config]
    .flat()
    .map(obj => obj.entries)
    .flatMap(entries => entries?.map(entry => (typeof entry === 'string' ? entry : entry.input)) ?? [])
    .map(toEntry);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
