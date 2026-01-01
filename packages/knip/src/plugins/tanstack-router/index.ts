import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

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

const entry = ['src/routeTree.gen.{ts,js}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
