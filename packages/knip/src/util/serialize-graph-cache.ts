import { createRequire } from 'node:module';
import { serialize } from 'node:v8';
import type { CacheSerializer } from './file-entry-cache.ts';

const createSerializer = (): CacheSerializer<unknown> => {
  if (!process.versions.bun) return serialize;
  const binding: {
    serialize: (value: unknown, options: { binaryType: 'nodebuffer' }) => Uint8Array;
  } = createRequire(import.meta.url)('bun:jsc');
  return value => binding.serialize(value, { binaryType: 'nodebuffer' });
};

export const serializeGraphCache = createSerializer();
