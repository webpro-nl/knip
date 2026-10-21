import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { deserialize, serialize } from 'node:v8';
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

test('Immutable entries serialize only after an insertion, payload replacement, metadata change, or deletion', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-immutable-cache-')));
  const filePath = join(cwd, 'selection.foo');
  let serializations = 0;
  const serializer: typeof serialize = value => {
    serializations++;
    return serialize(value);
  };

  try {
    writeFileSync(filePath, 'apple');
    const data = { fruit: 'apple' };
    const cache = new FileEntryCache<typeof data>('analysis', cwd, serializer, true);
    assert.equal(cache.isClean, false);
    cache.setFileData(filePath, data);
    assert.equal(cache.getFileDescriptor(filePath).changed, false);
    cache.reconcile();
    assert.equal(serializations, 1);
    assert.equal(cache.isClean, true);
    utimesSync(cache.filePath, 1, 1);

    cache.getFileDescriptor(filePath);
    cache.setFileData(filePath, data);
    cache.removeEntry(join(cwd, 'absent.foo'));
    assert.equal(cache.isClean, true);
    cache.reconcile();
    assert.equal(serializations, 1);
    assert.equal(statSync(cache.filePath).mtimeMs, 1000);

    const restored = new FileEntryCache<typeof data>('analysis', cwd, serializer, true);
    assert.equal(restored.isClean, true);
    assert.deepEqual(restored.getFileDescriptor(filePath).meta?.data, data);
    restored.reconcile();
    assert.equal(serializations, 1);

    restored.setFileData(filePath, { fruit: 'banana' });
    assert.equal(restored.isClean, false);
    restored.reconcile();
    assert.equal(serializations, 2);
    assert.deepEqual(new FileEntryCache<typeof data>('analysis', cwd).getFileDescriptor(filePath).meta?.data, {
      fruit: 'banana',
    });

    writeFileSync(filePath, 'cherry');
    const changed = new FileEntryCache<typeof data>('analysis', cwd, serializer, true);
    assert.equal(changed.getFileDescriptor(filePath).changed, true);
    assert.equal(changed.getFileDescriptor(filePath).meta?.data, undefined);
    assert.equal(changed.isClean, false);
    changed.reconcile();
    assert.equal(serializations, 3);

    changed.removeEntry(filePath);
    assert.equal(changed.isClean, false);
    changed.reconcile();
    assert.equal(serializations, 4);
    assert.equal(changed.isClean, true);
    assert.equal(new FileEntryCache('analysis', cwd).cache.has(filePath), false);
    changed.removeEntry(filePath);
    changed.reconcile();
    assert.equal(serializations, 4);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Immutable caches retry failed serialization and writes', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-immutable-cache-')));
  const filePath = join(cwd, 'selection.foo');
  let serializations = 0;
  const serializer: typeof serialize = value => {
    if (++serializations === 1) throw new Error('Serialization unavailable');
    return serialize(value);
  };

  try {
    writeFileSync(filePath, 'apple');
    const cache = new FileEntryCache<string>('analysis', cwd, serializer, true);
    cache.setFileData(filePath, 'apple');
    cache.reconcile();
    assert.equal(serializations, 1);
    assert.equal(cache.isClean, false);
    mkdirSync(cache.filePath);
    cache.reconcile();
    assert.equal(serializations, 2);
    assert.equal(cache.isClean, false);
    rmSync(cache.filePath, { recursive: true });
    cache.reconcile();
    assert.equal(serializations, 3);
    assert.equal(cache.isClean, true);
    assert.equal(new FileEntryCache<string>('analysis', cwd).getFileDescriptor(filePath).meta?.data, 'apple');
    cache.reconcile();
    assert.equal(serializations, 3);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Mutable caches retain nested and direct payload updates without source changes', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-mutable-cache-')));
  const filePath = join(cwd, 'shared.config.ts');

  try {
    writeFileSync(filePath, 'export default {};');
    const cache = new FileEntryCache<Record<string, string[]>>('plugins', cwd);
    cache.setFileData(filePath, { first: ['apple'] });
    cache.reconcile();
    const restored = new FileEntryCache<Record<string, string[]>>('plugins', cwd);
    assert.equal(restored.isClean, false);
    const descriptor = restored.getFileDescriptor(filePath);
    assert.ok(descriptor.meta?.data);
    descriptor.meta.data.first.push('banana');
    descriptor.meta.data = { ...descriptor.meta.data, second: ['cherry'] };
    restored.reconcile();
    assert.deepEqual(new FileEntryCache('plugins', cwd).getFileDescriptor(filePath).meta?.data, {
      first: ['apple', 'banana'],
      second: ['cherry'],
    });
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

test('Context changes replace populated caches with empty versioned envelopes without a lookup', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-cache-envelope-')));
  const filePath = join(cwd, 'selection.ts');
  let serializations = 0;
  const serializer: typeof serialize = value => {
    serializations++;
    return serialize(value);
  };

  try {
    writeFileSync(filePath, '');
    const first = new FileEntryCache<string>('analysis', cwd, serializer, true, 'first');
    first.setFileData(filePath, 'apple');
    first.reconcile();
    assert.equal(serializations, 1);
    const second = new FileEntryCache<string>('analysis', cwd, serializer, true, 'second');
    second.reconcile();
    assert.equal(serializations, 2);
    assert.deepEqual(deserialize(readFileSync(second.filePath)), {
      version: 1,
      context: 'second',
      entries: new Map(),
      dependencies: undefined,
    });
    second.reconcile();
    assert.equal(serializations, 2);
    const restored = new FileEntryCache<string>('analysis', cwd, serializer, true, 'second');
    restored.reconcile();
    assert.equal(serializations, 2);
    assert.equal(new FileEntryCache<string>('analysis', cwd, serializer, true, 'first').cache.size, 0);

    const third = new FileEntryCache<string>('analysis', cwd, serializer, true, 'third');
    rmSync(third.filePath);
    mkdirSync(third.filePath);
    third.reconcile();
    assert.equal(serializations, 3);
    rmSync(third.filePath, { recursive: true });
    third.reconcile();
    assert.equal(serializations, 4);
    assert.deepEqual(deserialize(readFileSync(third.filePath)), {
      version: 1,
      context: 'third',
      entries: new Map(),
      dependencies: undefined,
    });
    third.reconcile();
    assert.equal(serializations, 4);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Invalid serialized envelopes are replaced without reusing their records', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-cache-envelope-')));
  const cachePath = join(cwd, 'analysis');
  const entries = new Map([['obsolete', { size: 0, mtime: 0, data: 'apple' }]]);
  const malformed = [
    null,
    [],
    entries,
    { version: 2, context: 'current', entries },
    { context: 'current', entries },
    { version: 1, entries },
    { version: 1, context: 'obsolete', entries },
    { version: 1, context: 'current', entries: [] },
  ];

  try {
    for (const value of malformed) {
      writeFileSync(cachePath, serialize(value));
      const cache = new FileEntryCache<string>('analysis', cwd, serialize, true, 'current');
      assert.equal(cache.cache.size, 0);
      cache.reconcile();
      assert.deepEqual(deserialize(readFileSync(cachePath)), {
        version: 1,
        context: 'current',
        entries: new Map(),
        dependencies: undefined,
      });
    }
    assert.equal(new FileEntryCache<string>('analysis', cwd).cache.size, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Malformed file metadata is discarded before file descriptors are updated', () => {
  const cwd = toPosix(mkdtempSync(join(tmpdir(), 'knip-cache-envelope-')));
  const filePath = join(cwd, 'selection.ts');
  const cachePath = join(cwd, 'analysis');

  try {
    writeFileSync(filePath, '');
    for (const metadata of ['invalid', true, { size: 0 }, { mtime: 0 }, { size: Number.NaN, mtime: 0 }]) {
      writeFileSync(cachePath, serialize({ version: 1, context: 'current', entries: new Map([[filePath, metadata]]) }));
      const cache = new FileEntryCache<string>('analysis', cwd, serialize, true, 'current');
      assert.equal(cache.getFileDescriptor(filePath).changed, true);
      assert.equal(cache.getFileDescriptor(filePath).meta?.data, undefined);
      cache.setFileData(filePath, 'recovered');
      cache.reconcile();
      assert.equal(
        new FileEntryCache<string>('analysis', cwd, serialize, true, 'current').getFileDescriptor(filePath).meta?.data,
        'recovered'
      );
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
