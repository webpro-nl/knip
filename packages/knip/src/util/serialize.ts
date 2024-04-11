import type { SerializableFile } from '../types/map.js';

// biome-ignore lint/suspicious/noExplicitAny: TODO
const setisfy = (obj: any) => {
  if (obj instanceof Set) return Array.from(obj);
  if (typeof obj === 'object') for (const key in obj) obj[key] = setisfy(obj[key]);
  return obj;
};

// biome-ignore lint/suspicious/noExplicitAny: TODO
const unsetisfy = (obj: any) => {
  if (Array.isArray(obj)) return new Set(obj);
  if (typeof obj === 'object') for (const key in obj) obj[key] = unsetisfy(obj[key]);
  return obj;
};

export const serialize = (data: SerializableFile): SerializableFile => setisfy(structuredClone(data));

export const deserialize = (data: SerializableFile): SerializableFile => unsetisfy(data);
