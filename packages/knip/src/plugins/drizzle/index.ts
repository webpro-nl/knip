import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { DrizzleConfig } from './types.ts';

// https://orm.drizzle.team/kit-docs/overview

const title = 'Drizzle';

const enablers = ['drizzle-kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['drizzle.config.{ts,js,json}'];

const resolveConfig: ResolveConfig<DrizzleConfig> = config => {
  if (!config.schema) return [];
  return [config.schema].flat().map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
