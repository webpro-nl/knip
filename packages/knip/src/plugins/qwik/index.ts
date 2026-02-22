import MDX from '../../compilers/mdx.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers, ResolveFromAST } from '../../types/config.ts';
import { type Input, toEntry, toIgnore, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getRoutesDirs, getSrcDir } from './resolveFromAST.ts';

const title = 'Qwik';

const enablers = ['@builder.io/qwik'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const entry = ['src/entry.dev.tsx'];

const production = ['src/root.tsx', 'src/entry.*.tsx'];

const routeProduction = ['src/routes/**/*.{tsx,ts,md,mdx}'];

const resolveFromAST: ResolveFromAST = sourceFile => {
  const srcDir = getSrcDir(sourceFile);
  const routesDirs = getRoutesDirs(sourceFile, srcDir);
  const setSrcDir = (pattern: string) => pattern.replace(/^src\//, `${srcDir}/`);
  const setRoutesDir = (pattern: string, routesDir: string) => pattern.replace(/^src\/routes\//, `${routesDir}/`);

  const routeEntries: Input[] = [];
  for (const routesDir of routesDirs) {
    for (const pattern of routeProduction) {
      routeEntries.push(toProductionEntry(setRoutesDir(pattern, routesDir)));
    }
  }

  return [
    ...entry.map(setSrcDir).map(path => toEntry(path)),
    ...production.map(setSrcDir).map(path => toProductionEntry(path)),
    ...routeEntries,
    toIgnore('@qwik-city-plan', 'unlisted'),
    toIgnore('@qwik-city-sw-register', 'unlisted'),
    toIgnore('@qwik-client-manifest', 'unlisted'),
  ];
};

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('@builder.io/qwik-city')) {
    registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
  }
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production: [...production, ...routeProduction],
  registerCompilers,
  resolveFromAST,
};

export default plugin;
