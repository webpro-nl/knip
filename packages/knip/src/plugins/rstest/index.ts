import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://rstest.rs/

const title = 'Rstest';

const enablers = ['@rstest/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['rstest.config.{js,cjs,mjs,ts,cts,mts}'];

// const resolveConfig: ResolveConfig<PluginConfig> = async config => {
//   const inputs = config?.plugins ?? [];
//   return [...inputs].map(id => toDeferResolve(id));
// };

export default {
  title,
  enablers,
  isEnabled,
  config,
  // resolveConfig,
} satisfies Plugin;
