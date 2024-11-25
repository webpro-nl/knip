import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { TanstackRouterConfig } from './types.js';

// link to tanstack-router docs

const title = 'Tanstack Router';

const enablers = ['@tanstack/react-router', '@tanstack/router-plugin'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [
  'tsr.config.json',
  'vite.config.{js,mjs,ts,cjs,mts,cts}',
  'rs{pack,build}.config.{js,mjs,ts,cjs,mts,cts}',
];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<TanstackRouterConfig> = async config => {
  console.log('CONFIG', config);
  // const inputs = [];
  return [].map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
} satisfies Plugin;
