import type { Program } from 'oxc-parser';
import { findCallArg, getPropertyValues } from '../../typescript/ast-helpers.ts';

export const getSrcDir = (program: Program): string => {
  const arg = findCallArg(program, 'qwikVite');
  if (arg) {
    const values = getPropertyValues(arg, 'srcDir');
    if (values.size > 0) return Array.from(values)[0];
  }
  return 'src';
};

export const getRoutesDirs = (program: Program, srcDir: string): string[] => {
  const arg = findCallArg(program, 'qwikCity');
  if (arg) {
    const values = getPropertyValues(arg, 'routesDir');
    if (values.size > 0) return Array.from(values);
  }
  return [`${srcDir}/routes`];
};
