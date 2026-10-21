import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { createNativeResolverCache } from '../../src/native-resolver-cache.ts';
import { dirname, join } from '../../src/util/path.ts';
import { resolverPlan } from './resolver-plan.ts';

function fixture(run: (root: string, put: (file: string, content?: string) => string) => void) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'knip-resolver-recording-')));
  const put = (file: string, content = '') => {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return path;
  };
  try {
    put('package.json', '{"name":"recording"}');
    run(root, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('Uncached resolvers skip observations and resets preserve their recording mode', () =>
  fixture((root, put) => {
    const cache = createNativeResolverCache();
    cache.clear(false);
    const file = put('src/index.ts');
    const value = put('src/value.ts');
    const manifest = put('node_modules/example/package.json', '{"name":"example","main":"index.js"}');
    put('node_modules/example/index.js');
    for (const customCompilerExtensions of [[], ['.vue']]) {
      const resolver = new NativeModuleResolver(resolverPlan({ customCompilerExtensions }), undefined, cache);
      assert.equal(cache.resolveFile('./value', file), value);
      assert.equal(cache.resolvePackageManifestPath('example', root), manifest);
      assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, value);
      assert.equal(resolver.resolveModule('./missing', file), undefined);
      assert.deepEqual(resolver.resolutionDependencies(), { paths: [], files: [], complete: false });
      cache.clear();
    }
  }));

test('Cached and uncached transitions preserve stale plans and resume complete tracking for new plans', () =>
  fixture((root, put) => {
    const cache = createNativeResolverCache();
    const file = put('index.ts');
    const original = put('value.ts');
    const old = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(old.resolveModule('./value', file)?.resolvedFileName, original);
    assert.equal(old.resolutionDependencies().complete, true);
    cache.clear(false);
    const generated = put('value.js');
    assert.equal(cache.resolveFile('./value', file), generated);
    const uncached = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(uncached.resolveModule('./value', file)?.resolvedFileName, generated);
    assert.equal(old.resolveModule('./value', file)?.resolvedFileName, original);
    assert.equal(old.resolutionDependencies().complete, false);
    cache.clear(true);
    assert.equal(cache.resolveFile('./value', file), generated);
    const cached = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(cached.resolveModule('./value', file)?.resolvedFileName, generated);
    const dependencies = cached.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    assert.ok(dependencies.paths.includes(generated));
    assert.ok(dependencies.files.includes(join(root, 'package.json')));
    assert.equal(uncached.resolutionDependencies().complete, false);
    assert.equal(old.resolutionDependencies().complete, false);
    cache.clear();
    cache.clearModuleCaches();
    rmSync(generated);
    assert.equal(cached.resolveModule('./value', file)?.resolvedFileName, original);
    assert.equal(cached.resolutionDependencies().complete, false);
    const fresh = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(fresh.resolveModule('./value', file)?.resolvedFileName, original);
    assert.equal(fresh.resolutionDependencies().complete, true);
  }));

test('Custom file resolvers follow recording transitions without retaining unobserved backend results', () =>
  fixture((root, put) => {
    const cache = createNativeResolverCache();
    const file = put('index.ts');
    const original = put('value.ts');
    const custom = cache.createFileResolver(['.js', '.ts'], undefined, false);
    cache.clear(false);
    assert.equal(custom.resolveFile('./value', file), original);
    const generated = put('value.js');
    assert.equal(custom.resolveFile('./value', file), original);
    cache.clear(true);
    assert.equal(custom.resolveFile('./value', file), generated);
    const resolver = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, generated);
    assert.equal(resolver.resolutionDependencies().complete, true);
    assert.ok(resolver.resolutionDependencies().files.includes(join(root, 'package.json')));
  }));

test('Unobserved persistent store-name memos keep their value and cannot authorize cache persistence later', () =>
  fixture((root, put) => {
    const cache = createNativeResolverCache();
    cache.clear(false);
    const store = join(root, 'node_modules/.store/example/package');
    put('node_modules/.store/example/package/package.json', '{"name":"original"}');
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    cache.clear(true);
    const unrelated = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(unrelated.resolutionDependencies().complete, true);
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    const resolver = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(resolver.resolutionDependencies().complete, false);
    put('node_modules/.store/example/package/package.json', '{"name":"changed"}');
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    cache.clear();
    const fresh = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(fresh.resolutionDependencies().complete, false);
    cache.clear(true);
    const nextRun = new NativeModuleResolver(resolverPlan(), undefined, cache);
    assert.equal(nextRun.resolutionDependencies().complete, true);
  }));

test('Already observed store-name memos remain validated across uncached reads', () =>
  fixture((root, put) => {
    const cache = createNativeResolverCache();
    const store = join(root, 'node_modules/.store/example/package');
    const manifest = put('node_modules/.store/example/package/package.json', '{"name":"original"}');
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    cache.clear(false);
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    cache.clear(true);
    assert.deepEqual(cache.readStorePackageName(store), { text: 'original' });
    const resolver = new NativeModuleResolver(resolverPlan(), undefined, cache);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    assert.ok(dependencies.files.includes(manifest));
    put('node_modules/.store/example/package/package.json', '{"name":"changed"}');
    assert.equal(resolver.resolutionDependencies().complete, false);
  }));

test('Reusing a store-name memo validates the original content instead of recapturing changed files', () =>
  fixture((root, put) => {
    for (const present of [false, true]) {
      const cache = createNativeResolverCache();
      const name = present ? 'observed' : 'missing';
      const store = join(root, `node_modules/.store/${name}/package`);
      const manifest = `node_modules/.store/${name}/package/package.json`;
      if (present) put(manifest, '{"name":"original"}');
      const expected = present ? { text: 'original' } : null;
      assert.deepEqual(cache.readStorePackageName(store), expected);
      cache.clear(false);
      put(manifest, '{"name":"changed"}');
      cache.clear(true);
      assert.deepEqual(cache.readStorePackageName(store), expected);
      const resolver = new NativeModuleResolver(resolverPlan(), undefined, cache);
      assert.equal(resolver.resolutionDependencies().complete, false);
    }
  }));
