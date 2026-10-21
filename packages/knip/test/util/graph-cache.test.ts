import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { serialize } from 'node:v8';
import { GraphCacheConsultant } from '../../src/CacheConsultant.ts';
import { getNativeFileData, nativeGetImportsAndExports } from '../../src/native-analyzer.ts';
import type { FileNode } from '../../src/types/module-graph.ts';
import { createImports } from '../../src/util/create-imports.ts';
import { FileEntryCacheStorage } from '../../src/util/file-entry-cache-storage.ts';
import { createFileNode, updateImportMap } from '../../src/util/module-graph.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

async function closeFixture(t: TestContext) {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-close-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  writeFileSync(join(cwd, 'package.json'), '{}');
  writeFileSync(filePath, '');
  const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
  return { cacheLocation, filePath, options, file: createFileNode() };
}

test('Graph caches append changed analysis and validate the final journal dependency metadata', async t => {
  const { cacheLocation, filePath, options, file } = await closeFixture(t);
  let version = 'initial';
  const fingerprint = (paths: string[]) => JSON.stringify([paths, version]);
  const cache = new GraphCacheConsultant(options);
  cache.setContext('initial', fingerprint);
  const files: FileNode[] = [];
  for (let index = 0; index < 32; index++) {
    const path = `${filePath}.${index}`;
    writeFileSync(path, '');
    const entry = { ...file, scripts: new Set([`${index}:${'a'.repeat(2048)}`]) };
    files.push(entry);
    cache.setCachedFile(path, entry);
  }
  cache.reconcile({ paths: ['package.json'], files: [], complete: true });
  const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
  const bytes = readFileSync(cachePath);
  const warm = new GraphCacheConsultant(options);
  warm.setContext('initial', fingerprint);
  const replacement = { ...files[0], skipExports: true };
  warm.setCachedFile(`${filePath}.0`, replacement);
  warm.reconcile({ paths: ['tsconfig.json'], files: [], complete: true });
  const updated = readFileSync(cachePath);
  assert.deepEqual(updated.subarray(0, bytes.length), bytes);
  assert.ok(updated.length - bytes.length < bytes.length / 8);
  const restored = new GraphCacheConsultant(options);
  restored.setContext('initial', fingerprint);
  assert.deepEqual(restored.getCachedFile(`${filePath}.0`), replacement);
  assert.deepEqual(restored.getCachedFile(`${filePath}.1`), files[1]);
  assert.equal(restored.closeIfUnchanged(), true);
  assert.deepEqual(readFileSync(cachePath), updated);
  version = 'changed';
  const rejected = new GraphCacheConsultant(options);
  rejected.setContext('initial', fingerprint);
  assert.equal(rejected.getCachedFile(`${filePath}.0`), undefined);
  assert.equal(rejected.getCachedFile(`${filePath}.1`), undefined);
  rejected.reconcile({ paths: [], files: [], complete: true });
  const empty = new GraphCacheConsultant(options);
  empty.setContext('initial', fingerprint);
  assert.equal(empty.getCachedFile(`${filePath}.0`), undefined);
});

for (const mutation of ['none', 'dependency', 'source']) {
  test(`Closing unchanged graph caches preserves the original envelope after ${mutation} changes`, async t => {
    const { cacheLocation, filePath, options, file } = await closeFixture(t);
    let manifest = 'initial';
    let fingerprints = 0;
    const fingerprint = (paths: string[], files: string[]) => {
      fingerprints++;
      return JSON.stringify([paths, files, manifest]);
    };
    const dependencies = { paths: ['package.json'], files: ['package.json'], complete: true };
    const cache = new GraphCacheConsultant(options);
    assert.equal(cache.closeIfUnchanged(), false);
    cache.setContext('initial', fingerprint);
    assert.equal(cache.closeIfUnchanged(), false);
    cache.setCachedFile(filePath, file);
    cache.reconcile(dependencies);
    assert.equal(cache.closeIfUnchanged(), false);
    const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
    const bytes = readFileSync(cachePath);
    utimesSync(cachePath, 1, 1);

    const warm = new GraphCacheConsultant(options);
    warm.setContext('initial', fingerprint);
    assert.deepEqual(warm.getCachedFile(filePath), file);
    const validated = fingerprints;
    if (mutation === 'dependency') manifest = 'changed';
    if (mutation === 'source') writeFileSync(filePath, 'export const fruit = "apple";');
    assert.equal(warm.closeIfUnchanged(), true);
    assert.equal(warm.getCachedFile(filePath), undefined);
    assert.equal(warm.closeIfUnchanged(), false);
    warm.setContext('initial', fingerprint);
    assert.equal(warm.getCachedFile(filePath), undefined);
    warm.setContext('replacement', fingerprint);
    warm.setCachedFile(filePath, file);
    warm.removeEntry(filePath);
    warm.invalidate();
    warm.reconcile({ paths: ['new.json'], files: ['new.json'], complete: false });
    warm.reconcile(dependencies);
    warm.close();
    assert.equal(warm.getCachedFile(filePath), undefined);
    assert.equal(fingerprints, validated);
    assert.deepEqual(readFileSync(cachePath), bytes);
    assert.equal(statSync(cachePath).mtimeMs, 1000);

    const restored = new GraphCacheConsultant(options);
    restored.setContext('initial', fingerprint);
    assert.deepEqual(restored.getCachedFile(filePath), mutation === 'none' ? file : undefined);
  });
}

test('Dirty graph policy replacements reconcile dependency growth before closing', async t => {
  const { cacheLocation, filePath, options, file } = await closeFixture(t);
  const observed: string[][] = [];
  const fingerprint = (paths: string[]) => {
    observed.push([...paths]);
    return JSON.stringify(paths);
  };
  const cache = new GraphCacheConsultant(options);
  cache.setContext('initial', fingerprint);
  cache.setCachedFile(filePath, file);
  cache.reconcile({ paths: ['package.json'], files: [], complete: true });
  const warm = new GraphCacheConsultant(options);
  warm.setContext('initial', fingerprint);
  const replacement = { ...file, skipExports: true };
  warm.setCachedFile(filePath, replacement);
  assert.equal(warm.closeIfUnchanged(), false);
  assert.deepEqual(warm.getCachedFile(filePath), replacement);
  observed.length = 0;
  warm.reconcile({ paths: ['tsconfig.json'], files: [], complete: true });
  assert.deepEqual(observed, [['package.json', 'tsconfig.json'], ['package.json']]);
  warm.close();
  assert.equal(warm.getCachedFile(filePath), undefined);

  const restored = new GraphCacheConsultant(options);
  restored.setContext('initial', fingerprint);
  assert.deepEqual(restored.getCachedFile(filePath), replacement);
  const envelope = new FileEntryCacheStorage().read(join(cacheLocation, readdirSync(cacheLocation)[0]));
  assert.ok(envelope && typeof envelope === 'object' && 'dependencies' in envelope);
  assert.deepEqual(envelope.dependencies, {
    paths: ['package.json', 'tsconfig.json'],
    files: [],
    fingerprint: JSON.stringify(['package.json', 'tsconfig.json']),
  });
});

test('Explicit graph cache closure discards dirty records and cannot reopen', async t => {
  const { cacheLocation, filePath, options, file } = await closeFixture(t);
  const fingerprint = () => 'stable';
  const dependencies = { paths: [], files: [], complete: true };
  const cache = new GraphCacheConsultant(options);
  cache.setContext('initial', fingerprint);
  cache.setCachedFile(filePath, file);
  cache.reconcile(dependencies);
  const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
  const bytes = readFileSync(cachePath);

  const warm = new GraphCacheConsultant(options);
  warm.setContext('initial', fingerprint);
  warm.setCachedFile(filePath, { ...file, skipExports: true });
  assert.equal(warm.closeIfUnchanged(), false);
  warm.close();
  warm.setContext('initial', fingerprint);
  assert.equal(warm.getCachedFile(filePath), undefined);
  warm.setContext('replacement', fingerprint);
  warm.setCachedFile(filePath, file);
  warm.reconcile(dependencies);
  assert.equal(warm.getCachedFile(filePath), undefined);
  assert.deepEqual(readFileSync(cachePath), bytes);

  const uninitialized = new GraphCacheConsultant(options);
  uninitialized.close();
  uninitialized.setContext('initial', fingerprint);
  assert.equal(uninitialized.getCachedFile(filePath), undefined);
  assert.equal(uninitialized.closeIfUnchanged(), false);
  const restored = new GraphCacheConsultant(options);
  restored.setContext('initial', fingerprint);
  assert.deepEqual(restored.getCachedFile(filePath), file);
});

test('Graph caches cannot close as unchanged after a failed replacement write and can retry', async t => {
  const { cacheLocation, filePath, options, file } = await closeFixture(t);
  const fingerprint = () => 'stable';
  const dependencies = { paths: [], files: [], complete: true };
  const cache = new GraphCacheConsultant(options);
  cache.setContext('initial', fingerprint);
  cache.setCachedFile(filePath, file);
  cache.reconcile(dependencies);
  const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
  const bytes = readFileSync(cachePath);
  const warm = new GraphCacheConsultant(options);
  warm.setContext('initial', fingerprint);
  const replacement = { ...file, skipExports: true };
  warm.setCachedFile(filePath, replacement);
  rmSync(cachePath);
  mkdirSync(cachePath);
  warm.reconcile(dependencies);
  assert.equal(warm.closeIfUnchanged(), false);
  assert.deepEqual(warm.getCachedFile(filePath), replacement);
  rmSync(cachePath, { recursive: true });
  writeFileSync(cachePath, bytes);
  warm.reconcile(dependencies);
  assert.equal(warm.closeIfUnchanged(), true);

  const restored = new GraphCacheConsultant(options);
  restored.setContext('initial', fingerprint);
  assert.deepEqual(restored.getCachedFile(filePath), replacement);
});

test('Changing graph contexts replaces one cache file and rejects the previous context', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-context-')));
  const cacheLocation = join(cwd, '.cache');
  const firstPath = join(cwd, 'first.ts');
  const secondPath = join(cwd, 'second.ts');

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(firstPath, '');
    writeFileSync(secondPath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = createFileNode();
    const cache = new GraphCacheConsultant(options);
    cache.setContext('first');
    cache.setCachedFile(firstPath, file);
    cache.reconcile();
    const files = readdirSync(cacheLocation);
    assert.equal(files.length, 1);

    for (const context of ['second', 'third', 'fourth']) {
      cache.setContext(context);
      assert.equal(cache.getCachedFile(firstPath), undefined);
      assert.equal(cache.getCachedFile(secondPath), undefined);
      cache.setCachedFile(secondPath, file);
      cache.reconcile();
      assert.deepEqual(readdirSync(cacheLocation), files);

      const restored = new GraphCacheConsultant(options);
      restored.setContext(context);
      assert.equal(restored.closeIfUnchanged(), false);
      assert.equal(restored.getCachedFile(firstPath), undefined);
      assert.deepEqual(restored.getCachedFile(secondPath), file);
      const cachePath = join(cacheLocation, files[0]);
      utimesSync(cachePath, 1, 1);
      restored.reconcile();
      assert.equal(statSync(cachePath).mtimeMs, 1000);

      const obsolete = new GraphCacheConsultant(options);
      obsolete.setContext('first');
      assert.equal(obsolete.getCachedFile(firstPath), undefined);
      assert.equal(obsolete.getCachedFile(secondPath), undefined);
    }
    assert.ok(files[0].startsWith('root-analysis-v3-'));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Graph cache validates saved resolution dependencies and retains them across warm runs', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  const versions = new Map([['package.json', 'initial']]);
  const observed: string[][] = [];
  const observedFiles: string[][] = [];
  const fingerprint = (paths: string[], files: string[]) => {
    observed.push([...paths]);
    observedFiles.push([...files]);
    return JSON.stringify([paths, files.map(path => [path, versions.get(path)])]);
  };

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = createFileNode();
    const cache = new GraphCacheConsultant(options);
    cache.setContext('initial', fingerprint);
    cache.setCachedFile(filePath, file);
    cache.reconcile({ paths: ['package.json'], files: ['package.json'], complete: true });

    const warm = new GraphCacheConsultant(options);
    warm.setContext('initial', fingerprint);
    assert.deepEqual(warm.getCachedFile(filePath), file);
    const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
    utimesSync(cachePath, 1, 1);
    warm.reconcile({ paths: [], files: [], complete: true });
    assert.equal(statSync(cachePath).mtimeMs, 1000);
    assert.deepEqual(observed.at(-1), ['package.json']);
    assert.deepEqual(observedFiles.at(-1), ['package.json']);

    warm.reconcile({ paths: ['tsconfig.json'], files: ['tsconfig.json'], complete: true });
    const merged = new GraphCacheConsultant(options);
    merged.setContext('initial', fingerprint);
    assert.deepEqual(observed.at(-1), ['package.json', 'tsconfig.json']);
    assert.deepEqual(merged.getCachedFile(filePath), file);

    versions.set('tsconfig.json', 'added');
    const changed = new GraphCacheConsultant(options);
    changed.setContext('initial', fingerprint);
    assert.equal(changed.getCachedFile(filePath), undefined);
    changed.reconcile({ paths: [], files: [], complete: true });
    const replaced = new GraphCacheConsultant(options);
    replaced.setContext('initial', fingerprint);
    assert.equal(replaced.getCachedFile(filePath), undefined);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

for (const addDependency of [false, true]) {
  test(`Dependency changes after a warm hit discard stale analysis${addDependency ? ' when observations grow' : ''}`, async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
    const cacheLocation = join(cwd, '.cache');
    const filePath = join(cwd, 'index.ts');
    let manifest = 'initial';
    const fingerprint = (paths: string[]) => JSON.stringify([paths, manifest]);

    try {
      writeFileSync(join(cwd, 'package.json'), '{}');
      writeFileSync(filePath, '');
      const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
      const file = createFileNode();
      const cache = new GraphCacheConsultant(options);
      cache.setContext('initial', fingerprint);
      cache.setCachedFile(filePath, file);
      cache.reconcile({ paths: ['package.json'], files: ['package.json'], complete: true });

      const warm = new GraphCacheConsultant(options);
      warm.setContext('initial', fingerprint);
      assert.deepEqual(warm.getCachedFile(filePath), file);
      manifest = 'changed';
      warm.reconcile({ paths: addDependency ? ['tsconfig.json'] : [], files: [], complete: true });
      assert.equal(warm.getCachedFile(filePath), undefined);

      const restored = new GraphCacheConsultant(options);
      restored.setContext('initial', fingerprint);
      assert.equal(restored.getCachedFile(filePath), undefined);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}

test('Incomplete resolution tracking disables graph reuse and persistence for the run', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  const fingerprint = () => 'stable';

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = createFileNode();
    const unvalidated = new GraphCacheConsultant(options);
    unvalidated.setContext('initial');
    unvalidated.setCachedFile(filePath, file);
    unvalidated.reconcile();
    const cache = new GraphCacheConsultant(options);
    cache.setContext('initial', fingerprint);
    assert.equal(cache.getCachedFile(filePath), undefined);
    assert.equal(cache.closeIfUnchanged(), false);
    cache.setCachedFile(filePath, file);
    cache.reconcile({ paths: [], files: [], complete: true });

    const warm = new GraphCacheConsultant(options);
    warm.setContext('initial', fingerprint);
    assert.deepEqual(warm.getCachedFile(filePath), file);
    warm.reconcile({ paths: [], files: [], complete: false });
    assert.equal(warm.closeIfUnchanged(), false);
    assert.equal(warm.getCachedFile(filePath), undefined);
    warm.setCachedFile(filePath, file);
    warm.setContext('initial', fingerprint);
    assert.equal(warm.getCachedFile(filePath), undefined);
    warm.reconcile({ paths: [], files: [], complete: true });

    const restored = new GraphCacheConsultant(options);
    restored.setContext('initial', fingerprint);
    assert.equal(restored.getCachedFile(filePath), undefined);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Unavailable dependency fingerprints reject hits and discard newly analyzed records', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  const fingerprint = () => 'stable';
  const unavailable = [
    () => undefined,
    () => {
      throw new Error('Cannot fingerprint');
    },
  ];

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = createFileNode();
    for (const unavailableFingerprint of unavailable) {
      const cache = new GraphCacheConsultant(options);
      cache.setContext('initial', fingerprint);
      cache.setCachedFile(filePath, file);
      cache.reconcile({ paths: [], files: [], complete: true });
      const changed = new GraphCacheConsultant(options);
      changed.setContext('initial', unavailableFingerprint);
      assert.equal(changed.closeIfUnchanged(), false);
      assert.equal(changed.getCachedFile(filePath), undefined);
      changed.setCachedFile(filePath, file);
      changed.reconcile({ paths: [], files: [], complete: true });
      assert.equal(changed.closeIfUnchanged(), false);
      assert.equal(changed.getCachedFile(filePath), undefined);
      const restored = new GraphCacheConsultant(options);
      restored.setContext('initial', fingerprint);
      assert.equal(restored.getCachedFile(filePath), undefined);
      assert.equal(restored.closeIfUnchanged(), false);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Malformed dependency metadata cannot admit cached graph records', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  const fingerprint = () => 'stable';
  const invalid = [
    undefined,
    null,
    { fingerprint: 'stable', paths: [] },
    { fingerprint: 'stable', paths: [42], files: [] },
    { fingerprint: 'stable', paths: [], files: [42] },
    { paths: [], files: [] },
  ];

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const cache = new GraphCacheConsultant(options);
    cache.setContext('initial', fingerprint);
    cache.setCachedFile(filePath, createFileNode());
    cache.reconcile({ paths: [], files: [], complete: true });
    const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
    const envelope = new FileEntryCacheStorage().read(cachePath);
    assert.ok(envelope && typeof envelope === 'object');
    for (const dependencies of invalid) {
      writeFileSync(cachePath, serialize({ ...envelope, dependencies }));
      const restored = new GraphCacheConsultant(options);
      restored.setContext('initial', fingerprint);
      assert.equal(restored.getCachedFile(filePath), undefined);
      restored.reconcile({ paths: [], files: [], complete: true });
      const repaired = new GraphCacheConsultant(options);
      repaired.setContext('initial', fingerprint);
      assert.equal(repaired.getCachedFile(filePath), undefined);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Disabling dependency reuse retries a failed write without accepting new graph records', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-dependencies-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');
  const fingerprint = () => 'stable';

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, '');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = createFileNode();
    const cache = new GraphCacheConsultant(options);
    cache.setContext('initial', fingerprint);
    cache.setCachedFile(filePath, file);
    cache.reconcile({ paths: [], files: [], complete: true });
    const cachePath = join(cacheLocation, readdirSync(cacheLocation)[0]);
    const bytes = readFileSync(cachePath);
    rmSync(cachePath);
    mkdirSync(cachePath);
    cache.reconcile({ paths: [], files: [], complete: false });
    assert.equal(cache.closeIfUnchanged(), false);
    cache.setCachedFile(filePath, file);
    assert.equal(cache.getCachedFile(filePath), undefined);
    rmSync(cachePath, { recursive: true });
    writeFileSync(cachePath, bytes);
    cache.reconcile();

    const restored = new GraphCacheConsultant(options);
    restored.setContext('initial', fingerprint);
    assert.equal(restored.getCachedFile(filePath), undefined);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

for (const kind of ['native', 'graph']) {
  test(`Graph caches own ${kind} analysis independently of cold and restored graph mutations`, async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-cache-')));
    const cacheLocation = join(cwd, '.cache');
    const filePath = join(cwd, 'index.ts');
    const modulePath = join(cwd, 'module.ts');
    const source = `import { fruit } from './module';
export { fruit };
/** @public */ export enum Basket { Apple, Banana }
require.context('./plugins', true, /apple/g);`;

    try {
      writeFileSync(join(cwd, 'package.json'), '{}');
      writeFileSync(filePath, source);
      const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
      const analyzed = nativeGetImportsAndExports(
        filePath,
        source,
        () => ({ resolvedFileName: modulePath, isExternalLibraryImport: false }),
        { skipTypeOnly: false, isFixExports: true, isFixTypes: true, isReportExports: true, tags: [[], []] },
        true,
        false,
        ['webpack']
      );
      const file = kind === 'native' ? analyzed : structuredClone(analyzed);
      assert.equal(getNativeFileData(file) !== undefined, kind === 'native');
      const expected = structuredClone(file);
      const cache = new GraphCacheConsultant(options);
      cache.setContext('initial');
      assert.equal(cache.setCachedFile(filePath, file), file);
      if (kind === 'native') {
        const nativeOnly = cache.getCachedFile(filePath, false);
        assert.ok(nativeOnly);
        assert.equal(nativeOnly.imports.internal.size, 0);
        assert.deepEqual(getNativeFileData(nativeOnly), getNativeFileData(file));
      }

      const enrich = (node: FileNode) => {
        const imported = node.imports.imports.values().next().value;
        assert.ok(imported);
        node.imports.external.add({ ...imported, specifier: 'fixture-package' });
        node.imports.externalRefs.add({ specifier: 'plugin-package', identifier: undefined });
        node.imports.unresolved.add({ ...imported, specifier: './missing' });
        node.imports.programFiles.add(join(cwd, 'program.ts'));
        node.imports.entryFiles.add(join(cwd, 'entry.ts'));
        const imports = createImports();
        imports.refs.add('newReference');
        imports.import.set('newIdentifier', new Set([filePath]));
        updateImportMap(node, new Map([[modulePath, imports]]), new Map());
        const exported = node.exports.get('Basket');
        assert.ok(exported);
        exported.jsDocTags.add('@internal');
        exported.hasRefsInFile = true;
        exported.referencedIn = new Set(['fruit']);
        const member = exported.members[0];
        assert.ok(member);
        member.jsDocTags.add('@deprecated');
        node.importedBy = imports;
        node.internalImportCache = node.imports.internal;
        node.scripts.add('node program.ts');
        assert.equal(node.importGlobs[0].filter?.test('apple'), true);
      };

      enrich(file);
      assert.deepEqual(cache.getCachedFile(filePath), expected);
      cache.reconcile();

      const restored = new GraphCacheConsultant(options);
      restored.setContext('initial');
      const warm = restored.getCachedFile(filePath);
      assert.ok(warm);
      assert.deepEqual(warm, expected);
      enrich(warm);
      assert.deepEqual(restored.getCachedFile(filePath), expected);
      restored.reconcile();

      const persisted = new GraphCacheConsultant(options);
      persisted.setContext('initial');
      assert.deepEqual(persisted.getCachedFile(filePath), expected);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}

test('Graph cache context, source invalidation, and whole-graph invalidation reject old analysis', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-cache-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(filePath, 'export const fruit = "apple";');
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const file = nativeGetImportsAndExports(
      filePath,
      'export const fruit = "apple";',
      () => undefined,
      { skipTypeOnly: false, isFixExports: false, isFixTypes: false, isReportExports: true, tags: [[], []] },
      false,
      false
    );
    const cache = new GraphCacheConsultant(options);
    cache.setCachedFile(filePath, file);
    assert.equal(cache.getCachedFile(filePath), undefined);
    cache.setContext('initial');
    cache.setCachedFile(filePath, file);
    cache.reconcile();

    const restored = new GraphCacheConsultant(options);
    assert.equal(restored.getCachedFile(filePath), undefined);
    restored.setContext('changed');
    assert.equal(restored.getCachedFile(filePath), undefined);
    restored.setContext('initial');
    assert.deepEqual(restored.getCachedFile(filePath), file);
    restored.removeEntry(filePath);
    assert.equal(restored.getCachedFile(filePath), undefined);
    restored.setCachedFile(filePath, file);
    assert.deepEqual(restored.getCachedFile(filePath), file);
    restored.invalidate();
    restored.setContext('initial');
    assert.equal(restored.getCachedFile(filePath), undefined);
    restored.reconcile();

    const empty = new GraphCacheConsultant(options);
    empty.setContext('initial');
    assert.equal(empty.getCachedFile(filePath), undefined);
    empty.setCachedFile(filePath, file);
    empty.reconcile();
    writeFileSync(filePath, 'export const fruit = "banana";');
    const changed = new GraphCacheConsultant(options);
    changed.setContext('initial');
    assert.equal(changed.getCachedFile(filePath), undefined);

    const disabled = new GraphCacheConsultant({ ...options, isCache: false });
    const filesBefore = readdirSync(cacheLocation);
    disabled.setContext('disabled');
    assert.equal(disabled.setCachedFile(filePath, file), file);
    disabled.reconcile();
    assert.equal(disabled.getCachedFile(filePath), undefined);
    assert.deepEqual(readdirSync(cacheLocation), filesBefore);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
