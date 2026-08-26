import type { Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { findCallArg, getFirstPropertyValue, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toEntry, toIgnore, toProductionEntry } from '../../util/input.ts';

export const entry = ['src/entry.dev.tsx'];

export const production = ['src/root.tsx', 'src/entry.*.tsx'];

export const routeProduction = ['src/routes/**/*.{tsx,ts,md,mdx}'];

const getSrcDir = (program: Program): string => {
  const arg = findCallArg(program, 'qwikVite');
  return (arg && getFirstPropertyValue(arg, 'srcDir')) ?? 'src';
};

const getRoutesDirs = (program: Program, srcDir: string): string[] => {
  const arg = findCallArg(program, 'qwikCity');
  if (arg) {
    const values = Array.from(getPropertyValues(arg, 'routesDir')).filter(Boolean);
    if (values.length > 0) return values;
  }
  return [`${srcDir}/routes`];
};

export const resolveFromAST: ResolveFromAST = program => {
  const srcDir = getSrcDir(program);
  const routesDirs = getRoutesDirs(program, srcDir);
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
