import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { deserialize } from 'node:v8';
import {
  clearGlobCache,
  computeGlobCacheKey,
  createDirTracker,
  flushGlobCache,
  getCachedGlob,
  initGlobCache,
  setCachedGlob,
} from '../../src/util/glob-cache.ts';
import { getGitIgnoredHandler } from '../../src/util/glob-core.ts';
import { _glob, _syncGlob } from '../../src/util/glob.ts';
import { dirname, join, toPosix } from '../../src/util/path.ts';

const setup = (t: TestContext) => {
  const root = toPosix(fs.realpathSync(fs.mkdtempSync(join(toPosix(tmpdir()), 'knip-empty-glob-'))));
  const cwd = join(root, 'project');
  const cache = join(root, 'cache');
  fs.mkdirSync(join(cwd, 'src/orchard'), { recursive: true });
  initGlobCache(cache);
  t.after(() => {
    t.mock.restoreAll();
    clearGlobCache();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const patterns = ['src/**/*.ts'];
  const keyFor = (input = patterns, dir = cwd, gitignore = false) =>
    computeGlobCacheKey({ patterns: input, cwd, dir, gitignore, gitignoreFingerprint: '' });
  const scan = () => _glob({ cwd, patterns, gitignore: false });
  const add = (relativePath = 'src/orchard/apple.ts') => {
    const path = join(cwd, relativePath);
    fs.mkdirSync(dirname(path), { recursive: true });
    fs.writeFileSync(path, 'export {};\n');
    const mtime = fs.statSync(dirname(path)).mtimeMs / 1000 + 2;
    fs.utimesSync(dirname(path), mtime, mtime);
    return path;
  };
  return { root, cwd, cache, patterns, keyFor, scan, add };
};

const cacheEmpty = async (scan: () => Promise<string[]>, key: string) => {
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.deepEqual(getCachedGlob(key, true), []);
};

test('The first empty scan does no metadata work and a persisted hint remains a miss until safe capture', async t => {
  const { cache, keyFor, scan } = setup(t);
  const stat = t.mock.method(fs, 'statSync');
  const realpath = t.mock.method(fs.realpathSync, 'native');
  assert.deepEqual(await scan(), []);
  assert.equal(stat.mock.calls.length, 0);
  assert.equal(realpath.mock.calls.length, 0);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  assert.equal(getCachedGlob(keyFor()), undefined);
  assert.equal(stat.mock.calls.length, 0);
  assert.equal(realpath.mock.calls.length, 0);
  flushGlobCache();
  initGlobCache(cache);
  assert.equal(getCachedGlob(keyFor()), undefined);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  const read = t.mock.method(fs, 'readdir');
  assert.deepEqual(await scan(), []);
  assert.ok(read.mock.calls.length > 0);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
  const calls = read.mock.calls.length;
  assert.deepEqual(await scan(), []);
  assert.equal(read.mock.calls.length, calls);
});

test('A first positive scan avoids pre-read fingerprints and canonical path work', async t => {
  const { scan, add } = setup(t);
  const path = add();
  const stat = t.mock.method(fs, 'statSync');
  const realpath = t.mock.method(fs.realpathSync, 'native');
  const readdir = fs.readdir;
  t.mock.method(fs, 'readdir', (directory, options, callback) => {
    assert.equal(stat.mock.calls.length, 0);
    assert.equal(realpath.mock.calls.length, 0);
    return readdir(directory, options, callback);
  });
  assert.deepEqual(await scan(), [path]);
  assert.equal(stat.mock.calls.length, 3);
  assert.equal(realpath.mock.calls.length, 0);
});

test('Eligible async empty globs are reused after hint and capture crawls', async t => {
  const { cwd, keyFor, scan } = setup(t);
  const read = t.mock.method(fs, 'readdir');
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  assert.deepEqual(await scan(), []);
  const calls = read.mock.calls.length;
  assert.ok(calls > 0);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
  assert.deepEqual(await scan(), []);
  assert.equal(read.mock.calls.length, calls);
  const stat = t.mock.method(fs, 'statSync');
  assert.deepEqual(await scan(), []);
  const dirs = new Set(stat.mock.calls.map(call => call.arguments[0]));
  assert.deepEqual(dirs, new Set([cwd, join(cwd, 'src'), join(cwd, 'src/orchard')]));
});

for (const mutation of ['hint', 'capture', 'hit']) {
  test(`Mutating a ${mutation} empty array cannot affect repeated async reads`, async t => {
    const { cwd, cache, keyFor, scan } = setup(t);
    const cold = await scan();
    assert.deepEqual(cold, []);
    let paths = mutation === 'hint' ? cold : await scan();
    if (mutation === 'hit') paths = await scan();
    paths.push(join(cwd, 'rstest.config.ts'));
    assert.deepEqual(await scan(), []);
    const read = t.mock.method(fs, 'readdir');
    for (let i = 0; i < 2; i++) {
      const cached = await scan();
      assert.deepEqual(cached, []);
      assert.notEqual(cached, paths);
      cached.push(join(cwd, 'another.config.ts'));
    }
    assert.equal(read.mock.calls.length, 0);
    flushGlobCache();
    initGlobCache(cache);
    assert.deepEqual(await scan(), []);
    const cached = getCachedGlob(keyFor(), true);
    assert.ok(cached);
    cached.push(join(cwd, 'loaded.config.ts'));
    assert.deepEqual(getCachedGlob(keyFor(), true), []);
  });

  test(`Mutating a ${mutation} empty array cannot contaminate persistence or sync globs`, async t => {
    const { cwd, cache, keyFor } = setup(t);
    fs.mkdirSync(join(cwd, 'projects/orchard'), { recursive: true });
    const config = join(cwd, 'projects/orchard/rstest.config.ts');
    fs.writeFileSync(config, 'export {};\n');
    const patterns = ['projects/*'];
    const scan = () => _glob({ cwd, patterns, gitignore: false });
    const cold = await scan();
    assert.deepEqual(cold, []);
    let paths = mutation === 'hint' ? cold : await scan();
    if (mutation === 'hit') paths = await scan();
    paths.push(config);
    assert.deepEqual(_syncGlob({ cwd, patterns }), []);
    assert.deepEqual(await scan(), []);
    flushGlobCache();
    const cacheFile = fs.readdirSync(cache).find(name => name.startsWith('glob-'));
    assert.ok(cacheFile);
    const entries = deserialize(fs.readFileSync(join(cache, cacheFile)));
    assert.deepEqual(entries.get(keyFor(patterns)).paths, []);
    initGlobCache(cache);
    assert.deepEqual(_syncGlob({ cwd, patterns }), []);
    assert.deepEqual(await scan(), []);
  });
}

test('Empty directory tracking preserves a normalized Windows drive root', async t => {
  const { cwd } = setup(t);
  const root = 'C:/';
  const fingerprint = fs.statSync(cwd);
  const statSync = fs.statSync;
  const stat = t.mock.method(fs, 'statSync', (path, options) =>
    path === root ? fingerprint : statSync(path, options)
  );
  const realpath = fs.realpathSync.native;
  t.mock.method(fs.realpathSync, 'native', path =>
    path === root ? (process.platform === 'win32' ? 'C:\\' : root) : realpath(path)
  );
  t.mock.method(fs, 'readdir', (path, _options, callback) => {
    assert.equal(path, root);
    queueMicrotask(() => callback(null, []));
  });
  const tracker = createDirTracker(root);
  await new Promise<void>((resolve, reject) => {
    tracker.fs.readdir?.(root, { withFileTypes: true }, error => (error ? reject(error) : resolve()));
  });
  assert.ok(tracker.canCacheEmpty());
  assert.deepEqual(Object.keys(tracker.dirStats), [root]);
  assert.ok(!stat.mock.calls.some(call => call.arguments[0] === 'C:'));
});

test('Empty directory canonical checks preserve literal POSIX backslashes', async t => {
  if (process.platform === 'win32') {
    t.skip('Backslashes are path separators on Windows');
    return;
  }
  const { cwd } = setup(t);
  const directory = join(cwd, 'literal\\backslash');
  const fingerprint = fs.statSync(cwd);
  const statSync = fs.statSync;
  t.mock.method(fs, 'statSync', (path, options) => (path === directory ? fingerprint : statSync(path, options)));
  const realpath = fs.realpathSync.native;
  t.mock.method(fs.realpathSync, 'native', path => (path === directory ? directory : realpath(path)));
  t.mock.method(fs, 'readdir', (path, _options, callback) => {
    assert.equal(path, directory);
    queueMicrotask(() => callback(null, []));
  });
  const tracker = createDirTracker(directory);
  await new Promise<void>((resolve, reject) => {
    tracker.fs.readdir?.(directory, { withFileTypes: true }, error => (error ? reject(error) : resolve()));
  });
  assert.ok(tracker.canCacheEmpty());
  assert.deepEqual(Object.keys(tracker.dirStats), [directory]);
});

test('A same-process empty result notices a file in a previously empty subtree', async t => {
  const { keyFor, scan, add } = setup(t);
  await cacheEmpty(scan, keyFor());
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

test('A hint cannot hide a file created before the capture crawl', async t => {
  const { keyFor, scan, add } = setup(t);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

test('An invalidated empty entry retains eligibility for immediate safe recapture', async t => {
  const { keyFor, scan, add } = setup(t);
  await cacheEmpty(scan, keyFor());
  add('src/orchard/pear.js');
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  const read = t.mock.method(fs, 'readdir');
  assert.deepEqual(await scan(), []);
  assert.ok(read.mock.calls.length > 0);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
  const calls = read.mock.calls.length;
  assert.deepEqual(await scan(), []);
  assert.equal(read.mock.calls.length, calls);
});

test('A failed capture retains a hint and can recover without a directory change', async t => {
  const { keyFor, scan } = setup(t);
  assert.deepEqual(await scan(), []);
  const realpath = t.mock.method(fs.realpathSync, 'native', () => {
    throw new Error('realpath denied');
  });
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  realpath.mock.restore();
  assert.deepEqual(await scan(), []);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
});

test('An empty crawl changed while a descendant read is pending cannot be cached', async t => {
  const { cwd, keyFor, scan, add } = setup(t);
  assert.deepEqual(await scan(), []);
  const original = fs.readdir;
  let orchardPending = false;
  let created = '';
  const read = t.mock.method(fs, 'readdir', (directory, options, callback) => {
    const dir = String(directory).replace(/\/$/, '');
    if (dir === join(cwd, 'src/orchard')) orchardPending = true;
    return original(directory, options, (error, entries) => {
      if (dir === join(cwd, 'src/orchard')) orchardPending = false;
      callback(error, entries);
      if (dir === join(cwd, 'src')) {
        assert.ok(orchardPending);
        created = add('src/apple.ts');
      }
    });
  });
  assert.deepEqual(await scan(), []);
  assert.ok(created);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  read.mock.restore();
  assert.deepEqual(await scan(), [created]);
});

for (const emptyOperation of ['save', 'hit']) {
  test(`An empty ${emptyOperation} cannot prime a loaded positive glob's mtime memo`, async t => {
    const { cwd, cache, scan, add } = setup(t);
    const pear = add('src/orchard/pear.js');
    const scanJs = () => _glob({ cwd, patterns: ['src/**/*.js'], gitignore: false });
    assert.deepEqual(await scanJs(), [pear]);
    if (emptyOperation === 'hit') {
      assert.deepEqual(await scan(), []);
      assert.deepEqual(await scan(), []);
    }
    flushGlobCache();
    initGlobCache(cache);
    assert.deepEqual(await scan(), []);
    if (emptyOperation === 'save') assert.deepEqual(await scan(), []);
    const apple = add('src/orchard/apple.js');
    assert.deepEqual(new Set(await scanJs()), new Set([pear, apple]));
  });
}

test('A loaded empty glob notices a real directory replacement with preserved mtime', async t => {
  const { root, cwd, cache, keyFor } = setup(t);
  const directory = join(cwd, 'src/nested');
  const replacement = join(root, 'replacement');
  for (const dir of [directory, replacement]) fs.mkdirSync(join(dir, 'deep'), { recursive: true });
  fs.writeFileSync(join(replacement, 'deep/apple.ts'), '');
  const mtime = 1700000000;
  for (const dir of [directory, replacement]) fs.utimesSync(join(dir, 'deep'), mtime, mtime);
  const previous = fs.statSync(join(directory, 'deep'));
  const patterns = ['src/nested/deep/*.ts'];
  const scan = () => _glob({ cwd, patterns, gitignore: false });
  await cacheEmpty(scan, keyFor(patterns));
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(getCachedGlob(keyFor(patterns), true), []);
  fs.renameSync(directory, join(cwd, 'src/previous'));
  fs.renameSync(replacement, directory);
  const current = fs.statSync(join(directory, 'deep'));
  assert.equal(current.mtimeMs, previous.mtimeMs);
  assert.notEqual(current.ino, previous.ino);
  assert.deepEqual(await scan(), [join(directory, 'deep/apple.ts')]);
});

test('An empty glob notices same-inode changes when mtime is restored', async t => {
  const { cwd, cache, keyFor, scan, add } = setup(t);
  const directory = join(cwd, 'src/orchard');
  const mtime = 1700000000;
  fs.utimesSync(directory, mtime, mtime);
  const original = fs.statSync;
  let ctimeMs = 1700000001000;
  t.mock.method(fs, 'statSync', (path, options) => {
    const stat = original(path, options);
    if (path === directory && stat) stat.ctimeMs = ctimeMs;
    return stat;
  });
  const previous = fs.statSync(directory);
  await cacheEmpty(scan, keyFor());
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(await scan(), []);
  const path = add();
  fs.utimesSync(directory, mtime, mtime);
  ctimeMs++;
  assert.equal(fs.statSync(directory).ino, previous.ino);
  assert.equal(fs.statSync(directory).mtimeMs, previous.mtimeMs);
  assert.deepEqual(await scan(), [path]);
});

test('A persisted empty entry without directory identities is recrawled', async t => {
  const { cwd, cache, keyFor, scan } = setup(t);
  setCachedGlob(keyFor(), [], cwd, [join(cwd, 'src'), join(cwd, 'src/orchard')]);
  flushGlobCache();
  initGlobCache(cache);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  const read = t.mock.method(fs, 'readdir');
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.ok(read.mock.calls.length > 0);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
});

for (const relativePath of ['src/apple.ts', 'src/orchard/apple.ts', 'src/orchard/new/deep/apple.ts']) {
  test(`A persisted empty glob notices ${relativePath} across processes`, async t => {
    const { root, cwd, cache, patterns, add } = setup(t);
    const runner = join(root, 'probe.mjs');
    fs.writeFileSync(
      runner,
      `import fs from 'node:fs';
import { initGlobCache, flushGlobCache, getCachedGlob, computeGlobCacheKey } from ${JSON.stringify(new URL('../../src/util/glob-cache.ts', import.meta.url).href)};
import { _glob } from ${JSON.stringify(new URL('../../src/util/glob.ts', import.meta.url).href)};
const original = fs.readdir;
let reads = 0;
fs.readdir = function (...args) { reads++; return original.apply(this, args); };
const options = ${JSON.stringify({ cwd, patterns, gitignore: false })};
initGlobCache(${JSON.stringify(cache)});
const key = computeGlobCacheKey({ ...options, dir: options.cwd, gitignoreFingerprint: '' });
const cached = getCachedGlob(key, true);
const paths = await _glob(options);
flushGlobCache();
process.stdout.write(JSON.stringify({ cached, paths, reads }));`
    );
    const run = () => {
      const result = spawnSync(process.execPath, [runner], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, '');
      return JSON.parse(result.stdout);
    };
    const first = run();
    assert.deepEqual(first.paths, []);
    assert.equal(first.cached, undefined);
    assert.ok(first.reads > 0);
    const second = run();
    assert.deepEqual(second.paths, []);
    assert.equal(second.cached, undefined);
    assert.ok(second.reads > 0);
    assert.deepEqual(run(), { cached: [], paths: [], reads: 0 });
    const path = add(relativePath);
    const changed = run();
    assert.deepEqual(changed.paths, [path]);
    assert.equal(changed.cached, undefined);
    assert.ok(changed.reads > 0);
  });
}

test('A loaded empty glob bypasses a directory mtime memo primed by another key', async t => {
  const { cwd, cache, keyFor, scan, add } = setup(t);
  const existing = add('src/orchard/pear.js');
  await cacheEmpty(scan, keyFor());
  setCachedGlob('other', [existing], cwd, [join(cwd, 'src'), join(cwd, 'src/orchard')]);
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(getCachedGlob('other'), [existing]);
  const path = add();
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  assert.deepEqual(await scan(), [path]);
});

test('A loaded empty glob is freshly validated after every earlier hit', async t => {
  const { cache, keyFor, scan, add } = setup(t);
  await cacheEmpty(scan, keyFor());
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
  assert.deepEqual(await scan(), []);
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

test('Empty saves capture fresh fingerprints despite a stale positive-entry memo', async t => {
  const { cwd, cache, keyFor, scan, add } = setup(t);
  const orchard = join(cwd, 'src/orchard');
  setCachedGlob('prime', [join(orchard, 'pear.js')], cwd, [orchard]);
  add('src/orchard/pear.js');
  await cacheEmpty(scan, keyFor());
  flushGlobCache();
  const cacheFile = fs.readdirSync(cache).find(name => name.startsWith('glob-'));
  assert.ok(cacheFile);
  const entries = deserialize(fs.readFileSync(join(cache, cacheFile)));
  const entry = entries.get(keyFor());
  assert.ok(entry);
  const stat = fs.statSync(orchard);
  assert.deepEqual(entry.dirStats[orchard], {
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs,
    dev: stat.dev,
    ino: stat.ino,
  });
});

for (const directory of ['missing', 'src/missing/intermediate']) {
  test(`An absent crawl root ${directory} is not cached and can appear`, async t => {
    const { cwd, keyFor, add } = setup(t);
    const patterns = [`${directory}/**/*.ts`];
    const scan = () => _glob({ cwd, patterns, gitignore: false });
    assert.deepEqual(await scan(), []);
    assert.deepEqual(await scan(), []);
    assert.equal(getCachedGlob(keyFor(patterns), true), undefined);
    const path = add(`${directory}/apple.ts`);
    assert.deepEqual(await scan(), [path]);
  });
}

test('A missing base is not cached even when an absolute pattern reads an existing directory', async t => {
  const { cwd, keyFor, add } = setup(t);
  const dir = join(cwd, 'src/missing/base');
  const patterns = [join(cwd, 'src/orchard/*.ts')];
  const scan = () => _glob({ cwd, dir, patterns, gitignore: false });
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(['src/orchard/*.ts'], dir), true), undefined);
  fs.mkdirSync(dir, { recursive: true });
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

test('An empty static root through an intermediate symlink is not cached', async t => {
  const { root, cwd, keyFor } = setup(t);
  const empty = join(root, 'empty');
  const populated = join(root, 'populated');
  for (const dir of [empty, populated]) fs.mkdirSync(join(dir, 'deep'), { recursive: true });
  fs.writeFileSync(join(populated, 'deep/apple.ts'), '');
  const mtime = 1700000000;
  for (const dir of [empty, populated]) fs.utimesSync(join(dir, 'deep'), mtime, mtime);
  const link = join(cwd, 'src/link');
  fs.symlinkSync(empty, link, 'dir');
  const patterns = ['src/link/deep/*.ts'];
  const scan = () => _glob({ cwd, patterns, gitignore: false });
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(patterns), true), undefined);
  fs.unlinkSync(link);
  fs.symlinkSync(populated, link, 'dir');
  assert.deepEqual(await scan(), [join(link, 'deep/apple.ts')]);
});

test('A loaded empty root notices an intermediate directory replaced by a symlink with identical mtimes', async t => {
  const { root, cwd, cache, keyFor } = setup(t);
  const directory = join(cwd, 'src/nested');
  const populated = join(root, 'populated');
  for (const dir of [directory, populated]) fs.mkdirSync(join(dir, 'deep'), { recursive: true });
  fs.writeFileSync(join(populated, 'deep/apple.ts'), '');
  const mtime = 1700000000;
  for (const dir of [directory, populated]) fs.utimesSync(join(dir, 'deep'), mtime, mtime);
  const patterns = ['src/nested/deep/*.ts'];
  const scan = () => _glob({ cwd, patterns, gitignore: false });
  await cacheEmpty(scan, keyFor(patterns));
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(getCachedGlob(keyFor(patterns), true), []);
  fs.rmSync(directory, { recursive: true });
  fs.symlinkSync(populated, directory, 'dir');
  assert.deepEqual(await scan(), [join(directory, 'deep/apple.ts')]);
});

test('An unresolvable canonical directory path cannot produce a cached empty entry', async t => {
  const { keyFor, scan, add } = setup(t);
  const realpath = t.mock.method(fs.realpathSync, 'native', () => {
    throw new Error('realpath denied');
  });
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  realpath.mock.restore();
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

for (const patterns of [[], ['!src/**']]) {
  test(`No-read patterns ${JSON.stringify(patterns)} do not create entries`, async t => {
    const { cwd, keyFor } = setup(t);
    const read = t.mock.method(fs, 'readdir');
    assert.deepEqual(await _glob({ cwd, patterns, gitignore: false }), []);
    assert.equal(read.mock.calls.length, 0);
    assert.equal(getCachedGlob(keyFor(patterns), true), undefined);
  });
}

for (const code of ['EACCES', 'EIO']) {
  test(`A suppressed ${code} cannot become a cached empty result`, async t => {
    const { cwd, keyFor, scan, add } = setup(t);
    const path = add();
    const original = fs.readdir;
    let successes = 0;
    let failures = 0;
    const read = t.mock.method(fs, 'readdir', (directory, options, callback) => {
      if (String(directory).replace(/\/$/, '') === join(cwd, 'src/orchard')) {
        failures++;
        queueMicrotask(() => callback(Object.assign(new Error(code), { code }), []));
        return;
      }
      successes++;
      return original(directory, options, callback);
    });
    assert.deepEqual(await scan(), []);
    assert.deepEqual(await scan(), []);
    assert.ok(successes > 0 && failures > 0);
    assert.equal(getCachedGlob(keyFor(), true), undefined);
    read.mock.restore();
    assert.deepEqual(await scan(), [path]);
  });
}

test('A crawl with no successful reads recovers without a directory change', async t => {
  const { keyFor, scan, add } = setup(t);
  const path = add();
  const read = t.mock.method(fs, 'readdir', (_directory, _options, callback) => {
    queueMicrotask(() => callback(Object.assign(new Error('denied'), { code: 'EACCES' }), []));
  });
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  read.mock.restore();
  assert.deepEqual(await scan(), [path]);
});

test('A synchronous read failure is propagated and cannot save an empty entry', async t => {
  const { keyFor, scan, add } = setup(t);
  assert.deepEqual(await scan(), []);
  const error = new Error('read failed');
  const read = t.mock.method(fs, 'readdir', () => {
    throw error;
  });
  await assert.rejects(scan, error);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  read.mock.restore();
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

for (const failure of ['throw', 'missing', 'file', 'nan', 'infinite']) {
  test(`A ${failure} directory stat prevents saving an empty entry`, async t => {
    const { cwd, keyFor, scan, add } = setup(t);
    const original = fs.statSync;
    const stat = t.mock.method(fs, 'statSync', (path, options) => {
      if (path !== join(cwd, 'src/orchard')) return original(path, options);
      if (failure === 'throw') throw new Error('stat denied');
      if (failure === 'missing') return undefined;
      return { isDirectory: () => failure !== 'file', mtimeMs: failure === 'infinite' ? Infinity : Number.NaN };
    });
    assert.deepEqual(await scan(), []);
    assert.deepEqual(await scan(), []);
    assert.equal(getCachedGlob(keyFor(), true), undefined);
    stat.mock.restore();
    const path = add();
    assert.deepEqual(await scan(), [path]);
  });
}

test('A failed fresh validation drops a loaded empty entry and can recover', async t => {
  const { cwd, cache, keyFor, scan, add } = setup(t);
  await cacheEmpty(scan, keyFor());
  flushGlobCache();
  initGlobCache(cache);
  assert.deepEqual(getCachedGlob(keyFor(), true), []);
  const original = fs.statSync;
  const stat = t.mock.method(fs, 'statSync', (path, options) => {
    if (path === join(cwd, 'src/orchard')) throw new Error('stat denied');
    return original(path, options);
  });
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  stat.mock.restore();
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

test('A failed base stat prevents saving an otherwise eligible empty crawl', async t => {
  const { cwd, keyFor, scan } = setup(t);
  const original = fs.statSync;
  t.mock.method(fs, 'statSync', (path, options) => {
    if (path === cwd) throw new Error('base stat denied');
    return original(path, options);
  });
  assert.deepEqual(await scan(), []);
  assert.deepEqual(await scan(), []);
  assert.equal(getCachedGlob(keyFor(), true), undefined);
});

test('Sync globs cannot consume async empty entries and do not save empty results', async t => {
  const { cwd, keyFor } = setup(t);
  fs.mkdirSync(join(cwd, 'node_modules'), { recursive: true });
  const file = join(cwd, 'node_modules/apple.ts');
  fs.writeFileSync(file, '');
  const patterns = ['**/*.ts'];
  await cacheEmpty(() => _glob({ cwd, patterns, gitignore: false }), keyFor(patterns));
  assert.deepEqual(getCachedGlob(keyFor(patterns), true), []);
  assert.deepEqual(_syncGlob({ cwd, patterns }), [file]);
  const empty = ['src/**/*.js'];
  assert.deepEqual(_syncGlob({ cwd, patterns: empty }), []);
  assert.equal(getCachedGlob(keyFor(empty), true), undefined);
});

test('Gitignore-aware empty globs keep crawling without storing empties', async t => {
  const { cwd, patterns, add } = setup(t);
  fs.writeFileSync(join(cwd, '.gitignore'), '*.ts\n');
  const path = add();
  await getGitIgnoredHandler({ cwd, gitignore: true });
  const read = t.mock.method(fs, 'readdir');
  assert.deepEqual(await _glob({ cwd, patterns, gitignore: true, label: 'entry' }), []);
  const count = read.mock.calls.length;
  assert.deepEqual(await _glob({ cwd, patterns, gitignore: true, label: 'entry' }), []);
  assert.ok(read.mock.calls.length > count);
  fs.unlinkSync(join(cwd, '.gitignore'));
  await getGitIgnoredHandler({ cwd, gitignore: true });
  assert.deepEqual(await _glob({ cwd, patterns, gitignore: true, label: 'entry' }), [path]);
});

test('Positive cache hits retain path order and skip readdir', async t => {
  const { cwd, patterns, add } = setup(t);
  add('src/orchard/pear.ts');
  add('src/orchard/apple.ts');
  const paths = await _glob({ cwd, patterns, gitignore: false });
  assert.equal(paths.length, 2);
  const read = t.mock.method(fs, 'readdir');
  assert.equal(await _glob({ cwd, patterns, gitignore: false }), paths);
  assert.equal(read.mock.calls.length, 0);
});

test('Async directory tracking preserves callback arguments, receiver, and return value', t => {
  setup(t);
  const entries = ['pear.ts', 'apple.ts'];
  const receiver = {};
  const returned = {};
  const error = new Error('read failure');
  let failure: Error | null = null;
  t.mock.method(fs, 'readdir', (path, options, callback) => {
    assert.equal(path, '/orchard');
    assert.deepEqual(options, { encoding: 'utf8' });
    return callback.call(receiver, failure, entries);
  });
  const tracker = createDirTracker('/orchard');
  const callback = function (this: unknown, receivedError: unknown, receivedEntries: unknown) {
    assert.equal(this, receiver);
    assert.equal(receivedError, failure);
    assert.equal(receivedEntries, entries);
    return returned;
  };
  assert.equal(tracker.fs.readdir?.('/orchard', { encoding: 'utf8' }, callback), returned);
  failure = error;
  assert.equal(tracker.fs.readdir?.('/orchard', { encoding: 'utf8' }, callback), returned);
  const thrown = new Error('callback failure');
  assert.throws(
    () =>
      tracker.fs.readdir?.('/orchard', { encoding: 'utf8' }, () => {
        throw thrown;
      }),
    thrown
  );
});

test('Clearing glob caches drops empty entries and the positive directory mtime memo', async t => {
  const { cwd, keyFor, scan, add } = setup(t);
  await cacheEmpty(scan, keyFor());
  setCachedGlob('positive', ['pear.js'], cwd, [join(cwd, 'src/orchard')]);
  const hinted = () => _glob({ cwd, patterns: ['src/**/*.json'], gitignore: false });
  assert.deepEqual(await hinted(), []);
  clearGlobCache();
  const realpath = t.mock.method(fs.realpathSync, 'native');
  assert.deepEqual(await hinted(), []);
  assert.equal(realpath.mock.calls.length, 0);
  realpath.mock.restore();
  assert.equal(getCachedGlob(keyFor(), true), undefined);
  assert.equal(getCachedGlob('positive'), undefined);
  const path = add();
  assert.deepEqual(await scan(), [path]);
});

for (const type of ['added', 'deleted', 'modified']) {
  test(`A watch ${type} update resets empty entries and directory mtimes`, async t => {
    const { cwd, cache, keyFor, scan, add } = setup(t);
    fs.writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","private":true}');
    fs.writeFileSync(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["**/*.ts"]}');
    const entry = join(cwd, 'index.ts');
    fs.writeFileSync(entry, 'export {};\n');
    const { createSession } = await import('../../src/session/session.ts');
    const { createOptions } = await import('../helpers/create-options.ts');
    const session = await createSession(await createOptions({ cwd, isSession: true }));
    initGlobCache(cache);
    clearGlobCache();
    await cacheEmpty(scan, keyFor());
    const hinted = () => _glob({ cwd, patterns: ['src/**/*.json'], gitignore: false });
    assert.deepEqual(await hinted(), []);
    const orchard = join(cwd, 'src/orchard');
    setCachedGlob('prime-memo', ['pear.js'], cwd, [orchard]);
    add('src/orchard/pear.js');
    if (type === 'added') {
      const filePath = add();
      assert.ok(await session.handleFileChanges([{ type, filePath }]));
    } else if (type === 'deleted') {
      fs.unlinkSync(entry);
      assert.ok(await session.handleFileChanges([{ type, filePath: entry }]));
    } else {
      fs.writeFileSync(entry, 'export const pear = 1;\n');
      assert.ok(await session.handleFileChanges([{ type: 'modified', filePath: entry }]));
    }
    assert.equal(getCachedGlob(keyFor(), true), undefined);
    assert.equal(getCachedGlob('prime-memo'), undefined);
    const realpath = t.mock.method(fs.realpathSync, 'native');
    assert.deepEqual(await hinted(), []);
    assert.equal(realpath.mock.calls.length, 0);
    realpath.mock.restore();
    setCachedGlob('after-watch', ['pear.js'], cwd, [orchard]);
    flushGlobCache();
    const cacheFile = fs.readdirSync(cache).find(name => name.startsWith('glob-'));
    assert.ok(cacheFile);
    const entries = deserialize(fs.readFileSync(join(cache, cacheFile)));
    assert.equal(entries.get('after-watch').dirMtimes[orchard], fs.statSync(orchard).mtimeMs);
  });
}
