import type { IsPluginEnabled, Plugin, ResolveEntryPaths, ResolveFromAST } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { extname, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getCustomConfig } from './resolveFromAST.js';
import type { TanstackRouterConfig } from './types.js';

// https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing

const title = 'TanStack Router';

const enablers = ['@tanstack/react-router', '@tanstack/router-plugin', '@tanstack/router-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'tsr.config.json',
  'vite.config.{js,mjs,ts,cjs,mts,cts}',
  'rs{pack,build}.config.{js,mjs,ts,cjs,mts,cts}',
  'webpack.config.{js,mjs,ts,cjs,mts,cts}',
];

const production = ['./src/routeTree.gen.ts', './src/routes/**/*.{ts,tsx}', '!src/routes/**/-*/**'];

const getEntryPatterns = (config: TanstackRouterConfig) => {
  const dir = config.routesDirectory ?? 'src/routes';
  const entries = [
    toEntry(join(config.generatedRouteTree ?? './src/routeTree.gen.ts')),
    toEntry(join(dir, '**', `${config.routeFilePrefix ?? ''}*`)),
    toEntry(join(`!${dir}`, '**', `${config.routeFileIgnorePrefix ?? '-'}*`)),
  ];
  if (config.routeFileIgnorePattern) {
    entries.push(toEntry(join(`!${dir}`, '**', `*${config.routeFileIgnorePattern}*`)));
  }
  return entries;
};

const resolveEntryPaths: ResolveEntryPaths<TanstackRouterConfig> = (localConfig, options) => {
  if (extname(options.configFileName) !== '.json') return [];
  return getEntryPatterns(localConfig);
};

const resolveFromAST: ResolveFromAST = (sourceFile, options) => {
  if (extname(options.configFileName) === '.json') return [];
  const resolvedConfig = getCustomConfig(sourceFile);
  return getEntryPatterns(resolvedConfig);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveEntryPaths,
  resolveFromAST,
} satisfies Plugin;
