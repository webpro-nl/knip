import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { DrizzleConfig } from './types.js';

// https://orm.drizzle.team/kit-docs/overview

const title = 'Drizzle';

const enablers = ['drizzle-kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['drizzle.config.{ts,js,json}'];

const resolveConfig: ResolveConfig<DrizzleConfig> = config => {
  if (!config.schema) return [];
  return [config.schema].flat().map(id => toProductionEntry(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
