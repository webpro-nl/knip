import type { FileNode } from '../types/dependency-graph.js';
import { timerify } from './Performance.js';

// biome-ignore lint/suspicious/noExplicitAny: deal with it
const serializeObj = (obj: any): any => {
  if (!obj) return obj;
  if (obj instanceof Set) return Array.from(obj);
  if (obj instanceof Map) {
    const o: { [key: string]: unknown } = { _m: 1 };
    for (const [key, value] of obj) o[key] = serializeObj(value);
    return o;
  }
  if (typeof obj === 'object') for (const key in obj) obj[key] = serializeObj(obj[key]);
  return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: deal with it
const deserializeObj = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) return new Set(obj);
  if (obj._m) {
    const map = new Map();
    for (const key in obj) key !== '_m' && map.set(key, deserializeObj(obj[key]));
    return map;
  }
  if (typeof obj === 'object') for (const key in obj) obj[key] = deserializeObj(obj[key]);
  return obj;
};

const serialize = (data: FileNode): FileNode => {
  const clone = structuredClone(data);
  clone.imported = undefined;
  clone.internalImportCache = undefined;
  return serializeObj(clone);
};

const deserialize = (data: FileNode): FileNode => deserializeObj(data);

export const _serialize = timerify(serialize);

export const _deserialize = timerify(deserialize);
