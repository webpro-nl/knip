import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
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
