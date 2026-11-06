import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { EvaliteConfig } from './types.ts';

// https://www.evalite.dev/guides/configuration
// https://github.com/mattpocock/evalite/blob/evalite@0.19.0/packages/evalite/src/config.ts
// https://github.com/mattpocock/evalite/blob/evalite@0.19.0/packages/evalite/src/run-evalite.ts

const title = 'Evalite';

const enablers = ['evalite'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['evalite.config.{ts,mts,js,mjs}'];

// Evalite passes a fixed `include` to Vitest (run-evalite.ts), so this is not configurable
const entry = ['**/*.eval.?(m)ts'];

const resolveConfig: ResolveConfig<EvaliteConfig> = async localConfig => {
  const setupFiles = (localConfig?.setupFiles ?? []).map(specifier => toDeferResolve(specifier));
  return [...entry.map(toEntry), ...setupFiles];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
};

export default plugin;
