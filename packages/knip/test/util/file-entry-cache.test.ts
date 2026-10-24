import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { serialize } from 'node:v8';
import { FileEntryCache } from '../../src/util/file-entry-cache.ts';
import { join, toPosix } from '../../src/util/path.ts';

test('Persist file metadata in a new nested cache directory', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  const filePath = join(cwd, 'selection.foo');
  const cacheLocation = join(cwd, 'node_modules/.cache/knip');

  try {
    writeFileSync(filePath, 'apple\n');
    const cache = new FileEntryCache<string>('compiler', cacheLocation);
    const descriptor = cache.getFileDescriptor(filePath);
    assert.ok(descriptor.meta);
    descriptor.meta.data = 'compiled apple';
    cache.reconcile();

    const restored = new FileEntryCache<string>('compiler', cacheLocation).getFileDescriptor(filePath);
    assert.equal(restored.changed, false);
    assert.equal(restored.meta?.data, 'compiled apple');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Unchanged metadata is not written, replacements persist, and unused entries are removed', t => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const filePath = join(cwd, 'selection.ts');
  const unusedPath = join(cwd, 'unused.ts');
  writeFileSync(filePath, '');
  writeFileSync(unusedPath, '');
  const cache = new FileEntryCache<string>('analysis', cwd);
  cache.setFileData(filePath, 'apple');
  cache.setFileData(unusedPath, 'pear');
  cache.reconcile();
  const restored = new FileEntryCache<string>('analysis', cwd);
  assert.equal(restored.getFileDescriptor(filePath).meta?.data, 'apple');
  restored.reconcile();
  assert.equal(new FileEntryCache<string>('analysis', cwd).cache.has(unusedPath), false);
  const before = readFileSync(cache.filePath);
  utimesSync(cache.filePath, 1, 1);
  restored.reconcile();
  assert.deepEqual(readFileSync(cache.filePath), before);
  assert.equal(statSync(cache.filePath).mtimeMs, 1000);
  restored.setFileData(filePath, 'cherry');
  restored.reconcile();
  assert.equal(new FileEntryCache<string>('analysis', cwd).getFileDescriptor(filePath).meta?.data, 'cherry');
});

test('Contexts invalidate entries without changing the serialized Map format', t => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const filePath = join(cwd, 'selection.ts');
  writeFileSync(filePath, '');
  const cache = new FileEntryCache<string>('analysis', cwd, 'first');
  cache.setFileData(filePath, 'apple');
  cache.reconcile();
  assert.equal(new FileEntryCache<string>('analysis', cwd, 'first').getFileDescriptor(filePath).meta?.data, 'apple');
  const changed = new FileEntryCache<string>('analysis', cwd, 'second');
  assert.equal(changed.getFileDescriptor(filePath).changed, true);
  assert.equal(changed.getFileDescriptor(filePath).meta?.data, undefined);
});

test('Invalid cache containers and metadata recover as misses', t => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const filePath = join(cwd, 'selection.ts');
  writeFileSync(filePath, '');
  for (const data of [null, [], {}, new Map([[filePath, 'invalid']]), new Map([[filePath, { size: 0 }]])]) {
    writeFileSync(join(cwd, 'analysis'), serialize(data));
    const cache = new FileEntryCache<string>('analysis', cwd);
    assert.equal(cache.getFileDescriptor(filePath).changed, true);
    cache.setFileData(filePath, 'recovered');
    cache.reconcile();
    assert.equal(new FileEntryCache<string>('analysis', cwd).getFileDescriptor(filePath).meta?.data, 'recovered');
  }
});

test('Failed writes remain dirty and are retried', t => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const filePath = join(cwd, 'selection.ts');
  writeFileSync(filePath, '');
  const cache = new FileEntryCache<string>('analysis', cwd);
  cache.setFileData(filePath, 'apple');
  mkdirSync(cache.filePath);
  cache.reconcile();
  rmSync(cache.filePath, { recursive: true });
  cache.reconcile();
  assert.equal(new FileEntryCache<string>('analysis', cwd).getFileDescriptor(filePath).meta?.data, 'apple');
});

test('Recover from a truncated cache file', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-file-entry-cache-')));
  const filePath = join(cwd, 'selection.foo');
  const cacheLocation = join(cwd, 'node_modules/.cache/knip');

  try {
    writeFileSync(filePath, 'apple\n');
    mkdirSync(cacheLocation, { recursive: true });
    writeFileSync(join(cacheLocation, 'compiler'), Buffer.from([0xff]));

    const cache = new FileEntryCache<string>('compiler', cacheLocation);
    const descriptor = cache.getFileDescriptor(filePath);
    assert.equal(descriptor.changed, true);
    assert.ok(descriptor.meta);
    descriptor.meta.data = 'compiled apple';
    cache.reconcile();

    const restored = new FileEntryCache<string>('compiler', cacheLocation).getFileDescriptor(filePath);
    assert.equal(restored.changed, false);
    assert.equal(restored.meta?.data, 'compiled apple');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
