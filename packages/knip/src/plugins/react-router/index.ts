import { existsSync } from 'node:fs';
import os from 'node:os';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { _glob } from '../../util/glob.js';
import { toEntry, toProductionDependency, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import vite from '../vite/index.js';
import type { PluginConfig, RouteConfigEntry } from './types.js';

const isWindows = os.platform() === 'win32';
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
    .map(route => (isWindows ? route : route.replace(/[\^*+?()[\]]/g, '\\$&')));

  const resolved = [
    // routes.{ts,js} is only used as input to the bundler build system
    toEntry(join(appDir, 'routes.{js,ts}')),
    // routes and entries are part of the actual build
    toProductionEntry(join(appDir, 'root.{jsx,tsx}')),
    toProductionEntry(join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}')),
    ...routes.map(id => toProductionEntry(id)),
  ];

  const serverEntries = await _glob({
    cwd: appDir,
    patterns: ['entry.server.{js,ts,jsx,tsx}'],
  });

  // If there are no server entries, then we need to add these as implicit
  // production dependencies, as @react-router/dev will add the
  // default entry.server.tsx automatically which depends on these.
  // See: https://github.com/remix-run/react-router/blob/dev/packages/react-router-dev/config/defaults/entry.server.node.tsx
  if (serverEntries.length === 0) {
    resolved.push(toProductionDependency('@react-router/node'));
    resolved.push(toProductionDependency('isbot'));
  }

  return resolved;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
