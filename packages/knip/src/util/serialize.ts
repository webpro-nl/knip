import type { SerializableFile, SerializedFile } from '../types/serializable-map.js';
import { timerify } from './Performance.js';

const mapKeys = new Set(['exported', 'importedAs', 'internal', 'reExportedAs', 'reExportedBy', 'reExportedNs']);

// biome-ignore lint/suspicious/noExplicitAny: TODO
const serializeObj = (obj: any): any => {
  if (obj instanceof Set) return Array.from(obj);
  if (obj instanceof Map) return serializeObj(Object.fromEntries(obj.entries()));
  if (typeof obj === 'object') for (const key in obj) obj[key] = serializeObj(obj[key]);
  return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: TODO
const deserializeObj = (obj: any) => {
  if (Array.isArray(obj)) return new Set(obj);
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (mapKeys.has(key)) {
        if (!(obj[key] instanceof Map))
          obj[key] = new Map(Object.entries(obj[key]).map(v => [v[0], deserializeObj(v[1])]));
      } else obj[key] = deserializeObj(obj[key]);
    }
  }
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
