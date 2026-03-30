import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { TanStackRouterConfig } from './types.ts';

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

const production = ['src/routeTree.gen.{ts,js}'];

const resolveConfig: ResolveConfig<TanStackRouterConfig> = async (localConfig, options) => {
  const { configFileDir } = options;

  const generatedRouteTree = localConfig.generatedRouteTree ?? './src/routeTree.gen.ts';
  const routeTreePath = toAbsolute(generatedRouteTree, configFileDir);

  return [toProductionEntry(routeTreePath)];
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
