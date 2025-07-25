import { existsSync } from 'node:fs';
import os from 'node:os';
import fg from 'fast-glob';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry, toIgnore, toProductionEntry } from '../../util/input.js';
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
  const { configFileDir, manifest } = options;
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
    .map(route => (isWindows ? route : route.replace(/[$^*+?()\[\]]/g, '\\$&')));

  const resolved = [
    // routes.{ts,js} is only used as input to the bundler build system
    toEntry(join(appDir, 'routes.{js,ts}')),
    // routes and entries are part of the actual build
    toProductionEntry(join(appDir, 'root.{jsx,tsx}')),
    toProductionEntry(join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}')),
    ...routes.map(id => toProductionEntry(id)),
  ];

  // When using @react-router/serve,  @react-router/node and isbot will also
  // need to be installed. Since the server entry is optional, knip will flag
  // these dependencies as unused.
  // So add them to as ignored if
  //  - there's no server entry and
  //  - they're found in the manifest.
  const hasServerEntry = fg.sync(join(appDir, 'entry.server.{js,ts,jsx,tsx}')).length !== 0;
  if (!hasServerEntry) {
    const hasRRNode = manifest.dependencies?.['@react-router/node'];
    if (hasRRNode) {
      resolved.push(toIgnore('@react-router/node', 'dependencies'));
    }
    const hasIsBot = manifest.dependencies?.['isbot'];
    if (hasIsBot) {
      resolved.push(toIgnore('isbot', 'dependencies'));
    }
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
