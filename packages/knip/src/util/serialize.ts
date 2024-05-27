import type { SerializableFile } from '../types/serializable-map.js';

const keys = new Set(['importedAs', 'reExportedBy', 'reExportedAs', 'reExportedNs']);

// biome-ignore lint/suspicious/noExplicitAny: TODO
const setisfy = (obj: any): any => {
  if (obj instanceof Set) return Array.from(obj);
  if (obj instanceof Map) return setisfy(Object.fromEntries(obj.entries()));
  if (typeof obj === 'object')
    for (const key in obj) {
      obj[key] = setisfy(obj[key]);
    }
  return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: TODO
const unsetisfy = (obj: any) => {
  if (Array.isArray(obj)) return new Set(obj);
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (keys.has(key)) {
        if (!(obj[key] instanceof Map)) obj[key] = new Map(Object.entries(obj[key]).map(v => [v[0], unsetisfy(v[1])]));
      } else obj[key] = unsetisfy(obj[key]);
    }
  }
  return obj;
};

export const serialize = (data: SerializableFile): SerializableFile => setisfy(structuredClone(data));

export const deserialize = (data: SerializableFile): SerializableFile => unsetisfy(data);
