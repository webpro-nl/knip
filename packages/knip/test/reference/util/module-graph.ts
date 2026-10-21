import type { IdToFileMap, IdToNsToFileMap } from '../../../src/types/module-graph.ts';

export const addValue = (map: IdToFileMap, id: string, value: string) => {
  const existing = map.get(id);
  if (existing) existing.add(value);
  else map.set(id, new Set([value]));
};

export const addNsValue = (map: IdToNsToFileMap, id: string, ns: string, value: string) => {
  const inner = map.get(id);
  if (!inner) {
    map.set(id, new Map([[ns, new Set([value])]]));
    return;
  }
  const set = inner.get(ns);
  if (set) set.add(value);
  else inner.set(ns, new Set([value]));
};
