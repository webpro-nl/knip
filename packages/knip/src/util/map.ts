import type { IdMap, IdMapNs } from '../types/serializable-map.js';

export const addValue = (map: IdMap, id: string, value: string) => {
  if (map.has(id)) map.get(id)?.add(value);
  else map.set(id, new Set([value]));
};

export const addNsValue = (map: IdMapNs, id: string, ns: string, value: string) => {
  if (map.has(id)) {
    if (map.get(id)?.has(ns)) map.get(id)?.get(ns)?.add(value);
    else map.get(id)?.set(ns, new Set([value]));
  } else {
    map.set(id, new Map([[ns, new Set([value])]]));
  }
};

export const addValues = (map: IdMap, id: string, values: Set<string>) => {
  if (map.has(id)) for (const v of values) map.get(id)?.add(v);
  else map.set(id, values);
};

export const addNsValues = (map: IdMapNs, id: string, value: IdMap) => {
  // @ts-expect-error come on
  if (map.has(id)) for (const [ns, v] of value) addValues(map.get(id), ns, v);
  else map.set(id, value);
};
