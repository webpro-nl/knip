import { hasDependency } from '#p/util/plugin.js';
import { toProductionEntryPattern } from '#p/util/protocols.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { DrizzleConfig } from './types.js';

// https://orm.drizzle.team/kit-docs/overview

const title = 'Drizzle';

const enablers = ['drizzle-kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['drizzle.config.{ts,js,json}'];

const resolveConfig: ResolveConfig<DrizzleConfig> = config => {
  if (!config.schema) return [];
  return [config.schema].flat().map(toProductionEntryPattern);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
