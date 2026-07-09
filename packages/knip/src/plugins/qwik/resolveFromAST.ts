import type { Program } from 'oxc-parser';
import { findCallArg, getFirstPropertyValue, getPropertyValues } from '../../typescript/ast-helpers.ts';

export const getSrcDir = (program: Program): string => {
  const arg = findCallArg(program, 'qwikVite');
  return (arg && getFirstPropertyValue(arg, 'srcDir')) ?? 'src';
};

export const getRoutesDirs = (program: Program, srcDir: string): string[] => {
  const arg = findCallArg(program, 'qwikCity');
  if (arg) {
    const values = Array.from(getPropertyValues(arg, 'routesDir')).filter(Boolean);
    if (values.length > 0) return values;
  }
  return [`${srcDir}/routes`];
};
