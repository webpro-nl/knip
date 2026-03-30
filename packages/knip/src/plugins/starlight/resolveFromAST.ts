import type { Program } from 'oxc-parser';
import { findCallArg, getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.ts';

export const getComponentPathsFromSourceFile = (program: Program) => {
  const importMap = getImportMap(program);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');
  if (!starlightImportName) return new Set<string>();
  const arg = findCallArg(program, starlightImportName);
  return arg ? getPropertyValues(arg, 'components') : new Set<string>();
};
