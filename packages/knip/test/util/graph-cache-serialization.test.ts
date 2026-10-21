import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { deserialize, serialize } from 'node:v8';
import { nativeGetImportsAndExports } from '../../src/native-analyzer.ts';
import type { FileNode } from '../../src/types/module-graph.ts';
import { FileEntryCache } from '../../src/util/file-entry-cache.ts';
import { serializeGraphCache } from '../../src/util/serialize-graph-cache.ts';
import { join, toPosix } from '../../src/util/path.ts';

test('Module graph cache serialization preserves existing bytes and shared records', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-graph-cache-')));
  const filePath = join(cwd, 'index.ts');
  const source = `import { value as imported } from './dep';
export { imported as alias };
/** @public */ export class Café { method() {} }
export enum Kind { Zero, One }
export const text = '\\ud800\\0😀';
require.context('./plugins', true, /a/gi);`;
  try {
    writeFileSync(filePath, source);
    const file = nativeGetImportsAndExports(
      filePath,
      source,
      () => ({ resolvedFileName: join(cwd, 'dep.ts'), isExternalLibraryImport: false }),
      { skipTypeOnly: false, isFixExports: true, isFixTypes: true, isReportExports: true, tags: [[], []] },
      true,
      false,
      ['bun-shell', 'webpack']
    );
    const cache = new FileEntryCache<FileNode>('graph', cwd, serializeGraphCache);
    const descriptor = cache.getFileDescriptor(filePath);
    assert.ok(descriptor.meta);
    descriptor.meta.data = file;
    cache.cache.set(`${filePath}:shared`, descriptor.meta);
    const expected = serialize(cache.cache);
    cache.reconcile();
    const bytes = readFileSync(cache.filePath);
    assert.deepEqual(bytes, expected);
    const restored = deserialize(bytes);
    assert.deepEqual(restored, cache.cache);
    assert.equal(restored.get(filePath), restored.get(`${filePath}:shared`));
    assert.deepEqual(new FileEntryCache<FileNode>('graph', cwd).getFileDescriptor(filePath).meta?.data, file);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Generic file caches retain Buffer values', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-buffer-cache-')));
  const filePath = join(cwd, 'source.bin');
  try {
    writeFileSync(filePath, 'source');
    const cache = new FileEntryCache<Buffer>('generic', cwd);
    const descriptor = cache.getFileDescriptor(filePath);
    assert.ok(descriptor.meta);
    descriptor.meta.data = Buffer.from([0, 127, 255]);
    cache.reconcile();
    const restored = new FileEntryCache<Buffer>('generic', cwd).getFileDescriptor(filePath).meta?.data;
    assert.ok(Buffer.isBuffer(restored));
    assert.deepEqual(restored, descriptor.meta.data);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
