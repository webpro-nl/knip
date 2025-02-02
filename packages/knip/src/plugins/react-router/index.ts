import { existsSync } from 'node:fs';
import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig, RouteConfigEntry } from './types.js';

// https://reactrouter.com/start/framework/routing

const title = 'react-router';

const enablers = ['@react-router/dev'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['react-router.config.{js,ts}'];

const entry: string[] = [];

const production: string[] = [];

const resolveEntryPaths: ResolveEntryPaths<PluginConfig> = async (localConfig, options) => {
  const { configFileDir } = options;
  const appDirectory = localConfig.appDirectory ?? 'app';
  const appDir = join(configFileDir, appDirectory);

  let routeConfig: RouteConfigEntry[] = [];

  const routesPathTs = join(appDir, 'routes.ts');
  const routesPathJs = join(appDir, 'routes.js');

  if (existsSync(routesPathTs)) {
    routeConfig = await load(routesPathTs);
  } else if (existsSync(routesPathJs)) {
    routeConfig = await load(routesPathJs);
  }

  const mapRoute = (route: RouteConfigEntry): string[] => {
    return [join(appDir, route.file), ...(route.children ? route.children.flatMap(mapRoute) : [])];
  };

  const routes = routeConfig.flatMap(mapRoute);

  return [
    join(appDir, 'routes.{js,ts}'),
    join(appDir, 'root.{jsx,tsx}'),
    join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}'),
    ...routes,
  ].map(toEntry);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveEntryPaths,
} satisfies Plugin;
