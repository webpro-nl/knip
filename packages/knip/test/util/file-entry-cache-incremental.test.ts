import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { serialize } from 'node:v8';
import { FileEntryCache } from '../../src/util/file-entry-cache.ts';
import { join, toPosix } from '../../src/util/path.ts';

function fixture(t: TestContext, serializer: typeof serialize = serialize) {
  const cwd = toPosix(fs.mkdtempSync(join(tmpdir(), 'knip-incremental-cache-')));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const paths: string[] = [];
  const open = (context = 'stable') =>
    new FileEntryCache<string>('analysis', cwd, serializer, true, context, undefined, true);
  const cache = open();
  for (let index = 0; index < 64; index++) {
    const path = join(cwd, `${index}.ts`);
    fs.writeFileSync(path, 'source');
    paths.push(path);
    cache.setFileData(path, `${index}:${'a'.repeat(2048)}`);
  }
  cache.setDependencies({ paths, files: paths, fingerprint: 'initial' });
  cache.reconcile();
  return { cwd, paths, cache, open };
}

test('Incremental writes serialize only changed entries and leave the saved prefix intact', t => {
  const sizes: number[] = [];
  const { paths, cache, open } = fixture(t, value => {
    sizes.push(value.entries.size);
    return serialize(value);
  });
  const bytes = fs.readFileSync(cache.filePath);
  const warm = open();
  warm.setFileData(paths[0], 'updated');
  warm.reconcile();
  const updated = fs.readFileSync(cache.filePath);
  assert.deepEqual(sizes, [64, 1]);
  assert.deepEqual(updated.subarray(0, bytes.length), bytes);
  assert.ok(updated.length - bytes.length < 512);
  const restored = open();
  assert.equal(restored.getFileDescriptor(paths[0]).meta?.data, 'updated');
  assert.equal(restored.getFileDescriptor(paths[1]).meta?.data, `1:${'a'.repeat(2048)}`);
  assert.deepEqual(restored.getDependencies(), cache.getDependencies());
  fs.utimesSync(cache.filePath, 1, 1);
  restored.reconcile();
  assert.deepEqual(fs.readFileSync(cache.filePath), updated);
  assert.equal(fs.statSync(cache.filePath).mtimeMs, 1000);
});

test('Incremental deletion, reinsertion, dependency updates, and source invalidation survive restoration', t => {
  const { paths, open } = fixture(t);
  const cache = open();
  cache.removeEntry(paths[0]);
  cache.setFileData(paths[0], 'reinserted');
  cache.removeEntry(paths[1]);
  fs.writeFileSync(paths[2], 'changed source');
  assert.equal(cache.getFileDescriptor(paths[2]).changed, true);
  const dependencies = { paths: ['new.json'], files: [], fingerprint: 'new' };
  cache.setDependencies(dependencies);
  cache.reconcile();
  const restored = open();
  assert.deepEqual([...restored.cache.keys()], [...paths.slice(2), paths[0]]);
  assert.equal(restored.getFileDescriptor(paths[0]).meta?.data, 'reinserted');
  assert.equal(restored.getFileDescriptor(paths[1]).meta?.data, undefined);
  assert.equal(restored.getFileDescriptor(paths[2]).meta?.data, undefined);
  assert.deepEqual(restored.getDependencies(), dependencies);
  restored.clear();
  restored.reconcile();
  assert.equal(open().cache.size, 0);
  assert.equal(open().getDependencies(), undefined);
  const changed = open('changed');
  changed.setFileData(paths[3], 'new context');
  changed.reconcile();
  assert.equal(open().cache.size, 0);
  assert.equal(open('changed').cache.size, 1);
});

test('Incremental caches compact bounded journals without changing entry order or growing file counts', t => {
  const { cwd, paths, cache, open } = fixture(t);
  const initialSize = fs.statSync(cache.filePath).size;
  let previousSize = initialSize;
  let compactions = 0;
  for (let index = 0; index < 80; index++) {
    const warm = open();
    warm.setFileData(paths[0], `update ${index}`);
    warm.reconcile();
    const size = fs.statSync(cache.filePath).size;
    if (size < previousSize) compactions++;
    previousSize = size;
    assert.ok(size < initialSize * 1.5);
  }
  assert.ok(compactions >= 2);
  assert.deepEqual([...open().cache.keys()], paths);
  assert.equal(open().getFileDescriptor(paths[0]).meta?.data, 'update 79');
  assert.equal(fs.readdirSync(cwd).length, paths.length + 1);
});

test('Incremental caches reject truncated, corrupted, duplicated, and stale-branch journal frames', t => {
  const { paths, cache, open } = fixture(t);
  const original = fs.readFileSync(cache.filePath);
  const stale = open();
  const warm = open();
  warm.setFileData(paths[0], 'updated');
  warm.reconcile();
  const updated = fs.readFileSync(cache.filePath);
  const corrupted = Buffer.from(updated);
  corrupted[corrupted.length - 1] ^= 1;
  for (const bytes of [
    updated.subarray(0, updated.length - 1),
    corrupted,
    Buffer.concat([updated, updated.subarray(original.length)]),
  ]) {
    fs.writeFileSync(cache.filePath, bytes);
    const rejected = open();
    assert.equal(rejected.cache.size, 0);
    assert.equal(rejected.isClean, false);
    rejected.setFileData(paths[1], 'recovered');
    rejected.reconcile();
    assert.equal(open().getFileDescriptor(paths[1]).meta?.data, 'recovered');
  }
  fs.writeFileSync(cache.filePath, updated);
  stale.setFileData(paths[1], 'stale branch');
  stale.reconcile();
  assert.equal(open().cache.size, 0);
});

test('Incremental caches bound journal bytes even with large replacement records', t => {
  const { paths, cache, open } = fixture(t);
  const initial = fs.readFileSync(cache.filePath);
  const warm = open();
  warm.setFileData(paths[0], 'b'.repeat(40000));
  warm.reconcile();
  const appended = fs.readFileSync(cache.filePath);
  assert.deepEqual(appended.subarray(0, initial.length), initial);
  const next = open();
  next.setFileData(paths[0], 'c'.repeat(40000));
  next.reconcile();
  const compacted = fs.readFileSync(cache.filePath);
  assert.ok(compacted.length < appended.length);
  assert.equal(open().getFileDescriptor(paths[0]).meta?.data, 'c'.repeat(40000));
  assert.deepEqual([...open().cache.keys()], paths);
});

test('Incremental caches retry failed serialization with all pending deletions and metadata', t => {
  let fail = false;
  const { paths, cache, open } = fixture(t, value => {
    if (fail) throw new Error('Serialization failed');
    return serialize(value);
  });
  const bytes = fs.readFileSync(cache.filePath);
  const warm = open();
  warm.removeEntry(paths[1]);
  warm.setFileData(paths[0], 'updated');
  const dependencies = { paths: [], files: [], fingerprint: 'updated' };
  warm.setDependencies(dependencies);
  fail = true;
  warm.reconcile();
  assert.equal(warm.isClean, false);
  assert.deepEqual(fs.readFileSync(cache.filePath), bytes);
  fail = false;
  warm.reconcile();
  assert.equal(warm.isClean, true);
  const restored = open();
  assert.equal(restored.getFileDescriptor(paths[0]).meta?.data, 'updated');
  assert.equal(restored.cache.has(paths[1]), false);
  assert.deepEqual(restored.getDependencies(), dependencies);
});

test('Incremental caches retry failed appends after a partial frame without losing pending mutations', t => {
  const { paths, cache, open } = fixture(t);
  const warm = open();
  warm.removeEntry(paths[1]);
  warm.setFileData(paths[0], 'updated');
  const append = fs.appendFileSync;
  try {
    fs.appendFileSync = (path, data) => {
      assert.ok(data instanceof Uint8Array);
      append(path, data.subarray(0, 11));
      throw new Error('Partial write');
    };
    warm.reconcile();
    assert.equal(warm.isClean, false);
  } finally {
    fs.appendFileSync = append;
  }
  assert.equal(open().cache.size, 0);
  warm.reconcile();
  assert.equal(warm.isClean, true);
  assert.equal(open().getFileDescriptor(paths[0]).meta?.data, 'updated');
  assert.equal(open().cache.has(paths[1]), false);
  assert.equal(fs.readdirSync(join(cache.filePath, '..')).length, paths.length + 1);
});

test('Incremental opt-in preserves unchanged legacy envelopes and migrates on the first write', t => {
  const { cwd, paths, cache, open } = fixture(t);
  const legacy = new FileEntryCache<string>('analysis', cwd, serialize, true, 'stable');
  legacy.setFileData(paths[0], 'legacy');
  legacy.reconcile();
  const bytes = fs.readFileSync(cache.filePath);
  const restored = open();
  assert.equal(restored.getFileDescriptor(paths[0]).meta?.data, 'legacy');
  restored.reconcile();
  assert.deepEqual(fs.readFileSync(cache.filePath), bytes);
  restored.setFileData(paths[0], 'migrated');
  restored.reconcile();
  assert.equal(open().getFileDescriptor(paths[0]).meta?.data, 'migrated');
});
