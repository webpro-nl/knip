import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { ConvexConfig } from './types.ts';

// https://docs.convex.dev/home

const title = 'Convex';

const enablers = ['convex'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['convex.json'];

const production = ['convex/**/*.@(js|ts)'];

const resolveConfig: ResolveConfig<ConvexConfig> = localConfig => {
  const functionsDir = typeof localConfig.functions === 'string' ? localConfig.functions : 'convex';
  return [toProductionEntry(join(functionsDir, '**/*.@(js|ts)'))];
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
