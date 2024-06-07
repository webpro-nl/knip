import type { SerializableFile, SerializedFile } from '../types/serializable-map.js';
import { timerify } from './Performance.js';

// biome-ignore lint/suspicious/noExplicitAny: TODO
const serializeObj = (obj: any): any => {
  if (obj instanceof Set) return Array.from(obj);
  if (obj instanceof Map) {
    const o = serializeObj(Object.fromEntries(obj.entries()));
    o._m = 1;
    return o;
  }
  if (typeof obj === 'object') for (const key in obj) obj[key] = serializeObj(obj[key]);
  return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: TODO
const deserializeObj = (obj: Record<string, any>): Record<string, any> => {
  if (Array.isArray(obj)) return new Set(obj);
  if (obj._m) {
    // biome-ignore lint/performance/noDelete: _m needs to go
    delete obj._m;
    return new Map(Object.entries(obj).map(v => [v[0], deserializeObj(v[1])]));
  }
  if (typeof obj === 'object') for (const key in obj) obj[key] = deserializeObj(obj[key]);
  return obj;
};

const serialize = (data: SerializableFile): SerializedFile => {
  const clone = structuredClone(data);
  clone.imported = undefined;
  clone.internalImportCache = undefined;
  return serializeObj(clone);
};

const deserialize = (data: SerializedFile): SerializableFile => deserializeObj(data);

export const _serialize = timerify(serialize);

export const _deserialize = timerify(deserialize);
