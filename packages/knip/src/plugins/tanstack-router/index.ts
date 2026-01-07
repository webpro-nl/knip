import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { join, toAbsolute } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { TanStackRouterConfig } from './types.js';

// https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing

const title = 'TanStack Router';

const enablers = [
  '@tanstack/react-router',
  '@tanstack/solid-router',
  '@tanstack/vue-router',
  '@tanstack/svelte-router',
  '@tanstack/router-cli',
  '@tanstack/router-plugin',
];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsr.config.json'];

const production = ['src/routeTree.gen.{ts,js}', 'src/routes/**/*.{ts,tsx,js,jsx}'];

const resolveConfig: ResolveConfig<TanStackRouterConfig> = async (localConfig, options) => {
  const { configFileDir } = options;

  const routesDirectory = localConfig.routesDirectory ?? './src/routes';
  const generatedRouteTree = localConfig.generatedRouteTree ?? './src/routeTree.gen.ts';

  const routesDir = toAbsolute(routesDirectory, configFileDir);
  const routeTreePath = toAbsolute(generatedRouteTree, configFileDir);

  return [
    toProductionEntry(routeTreePath, { allowIncludeExports: true }),
    toProductionEntry(join(routesDir, '**/*.{ts,tsx,js,jsx}'), { allowIncludeExports: true }),
  ];
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
