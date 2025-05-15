import { existsSync } from 'node:fs';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import vite from '../vite/index.js';
import type { PluginConfig, RouteConfigEntry } from './types.js';

// https://reactrouter.com/start/framework/routing

const title = 'React Router';

const enablers = ['@react-router/dev'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['react-router.config.{js,ts}', ...vite.config];

const resolveConfig: ResolveConfig<PluginConfig> = async (localConfig, options) => {
  const { configFileDir } = options;
  const appDirectory = localConfig.appDirectory ?? 'app';
  const appDir = join(configFileDir, appDirectory);

  // If using flatRoutes from @react-router/fs-routes it will throw an error if this variable is not defined
  // @ts-expect-error
  globalThis.__reactRouterAppDirectory = appDir;

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

  const routes = routeConfig
    .flatMap(mapRoute)
    // Since these are literal paths, we need to escape any special characters that might
    // trip up micromatch/fast-glob.
    // See:
    //  - https://reactrouter.com/how-to/file-route-conventions#optional-segments
    //  - https://www.npmjs.com/package/fast-glob#advanced-syntax
    .map(route => route.replace(/[$^*+?()\[\]]/g, '\\$&'));

  return [
    join(appDir, 'routes.{js,ts}'),
    join(appDir, 'root.{jsx,tsx}'),
    join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}'),
    ...routes,
  ].map(id => toEntry(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
