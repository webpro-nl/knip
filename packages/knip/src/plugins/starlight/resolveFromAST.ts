import type { Program } from 'oxc-parser';
import { findCallArg, getDefaultImportName, getImportMap, getPropertyValues } from '../../typescript/ast-helpers.ts';

export const getComponentPathsFromSourceFile = (program: Program) => {
  const importMap = getImportMap(program);
  const starlightImportName = getDefaultImportName(importMap, '@astrojs/starlight');
  if (!starlightImportName) return new Set<string>();
  const arg = findCallArg(program, starlightImportName);
  return arg ? getPropertyValues(arg, 'components') : new Set<string>();
};

export const getCalleeImportSources = (node: any, propertyName: string, importMap: Map<string, string>) => {
  const sources = new Set<string>();
  if (node?.type !== 'ObjectExpression') return sources;
  for (const prop of node.properties ?? []) {
    if (prop.type !== 'Property') continue;
    const key = prop.key?.name ?? prop.key?.value;
    if (key !== propertyName) continue;
    const init = prop.value;
    if (init?.type !== 'ArrayExpression') continue;
    for (const el of init.elements ?? []) {
      if (el?.type !== 'CallExpression') continue;
      if (el.callee?.type === 'Identifier' && el.callee.name) {
        const source = importMap.get(el.callee.name);
        if (source) sources.add(source);
      }
    }
  }
  return sources;
};
