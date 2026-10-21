import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { createNativeFile, createNativeOptions } from '../../src/native-analyzer.ts';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { nativeResolverCache } from '../../src/native-resolver-cache.ts';
import { dirname, join } from '../../src/util/path.ts';
import { encodePackageTarget, resolverPlan } from './resolver-plan.ts';

function fixture(run: (root: string, put: (file: string, content?: string) => string) => void) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'knip-native-dependencies-')));
  const put = (file: string, content = '') => {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return path;
  };
  try {
    nativeResolverCache.clear(true);
    put('package.json', '{"name":"resolver-dependencies"}');
    run(root, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('Serial resolution and native batches share source mapping misses across compiler writes', () =>
  fixture((root, put) => {
    const target = put('dist/value.js', 'export const value = 1;');
    const file = put('first/index.ts');
    const resolver = new NativeModuleResolver(
      resolverPlan({
        availableWorkspaceDirs: [root],
        workspaces: [
          {
            dir: root,
            sourceMaps: [{ srcDir: join(root, 'src'), outDir: join(root, 'dist') }],
            imports: encodePackageTarget(undefined),
            exports: encodePackageTarget(undefined),
          },
        ],
      })
    );
    assert.equal(resolver.resolveModule(target, file)?.resolvedFileName, target);
    assert.equal(resolver.resolutionDependencies().complete, true);
    put('src/value.ts', 'export const value = 2;');
    const options = createNativeOptions(
      { skipTypeOnly: false, isFixExports: false, isFixTypes: false, isReportExports: true, tags: [[], []] },
      false,
      false
    );
    const requests = [];
    for (let index = 0; index < 16; index++) {
      requests.push({
        filePath: put(
          `later-${index}/index.ts`,
          `import { value } from ${JSON.stringify(target)}; console.log(value);`
        ),
        options,
      });
    }
    for (const result of resolver.analyzeFiles(requests)) {
      assert.ok(result.file);
      assert.deepEqual([...createNativeFile(result.file).imports.internal.keys()], [target]);
    }
    assert.equal(resolver.resolutionDependencies().complete, false);
  }));

test('Resolution dependencies retain unsuccessful probes and package reads without invalidating source edits', () =>
  fixture((root, put) => {
    const file = put('src/index.ts');
    const target = put('src/value.ts', 'export const value = 1;');
    const manifest = put('node_modules/example/package.json', '{"name":"example","exports":"./one.js"}');
    const packageTarget = put('node_modules/example/one.js');
    put('node_modules/example/two.js');
    const resolver = new NativeModuleResolver(resolverPlan());
    assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, target);
    assert.equal(resolver.resolveModule('./later', file), undefined);
    assert.equal(resolver.resolveModule('example', file)?.resolvedFileName, packageTarget);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    assert.ok(dependencies.paths.includes(join(root, 'src/value.js')));
    assert.ok(dependencies.paths.includes(join(root, 'src/later.ts')));
    assert.ok(dependencies.files.includes(manifest));
    assert.ok(dependencies.paths.includes(target));
    assert.ok(!dependencies.files.includes(target));
    assert.deepEqual(resolver.resolutionDependencies(), dependencies);
    const fingerprint = () => resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files);
    const initial = fingerprint();
    assert.ok(initial);
    put('src/value.ts', 'export const changedValue = 123456;');
    put('src/unrelated.ts');
    assert.equal(fingerprint(), initial);
    assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, target);
    assert.deepEqual(resolver.resolutionDependencies(), dependencies);
    put('src/value.js');
    assert.notEqual(fingerprint(), initial);
    rmSync(join(root, 'src/value.js'));
    assert.equal(fingerprint(), initial);
    put('src/later.ts');
    assert.notEqual(fingerprint(), initial);
    rmSync(join(root, 'src/later.ts'));
    assert.equal(fingerprint(), initial);
    put('node_modules/example/package.json', '{"name":"example","exports":"./two.js"}');
    assert.notEqual(fingerprint(), initial);
    assert.equal(resolver.resolutionDependencies().complete, false);
  }));

test('Resolution dependencies reject a higher-priority target created after native resolution', () =>
  fixture((root, put) => {
    const file = put('src/index.ts');
    const original = put('generated/target.ts', 'export const value = 1;');
    const resolver = new NativeModuleResolver(resolverPlan());
    assert.equal(resolver.resolveModule('../generated/target', file)?.resolvedFileName, original);
    assert.equal(resolver.resolutionDependencies().complete, true);
    const generated = put('generated/target.js', 'export const value = 2;');
    assert.equal(resolver.resolveModule('../generated/target', file)?.resolvedFileName, original);
    const dependencies = resolver.resolutionDependencies();
    assert.ok(dependencies.paths.includes(generated));
    assert.ok(resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files));
    assert.equal(dependencies.complete, false);
    nativeResolverCache.clear();
    const fresh = new NativeModuleResolver(resolverPlan());
    assert.equal(fresh.resolveModule('../generated/target', file)?.resolvedFileName, generated);
  }));

test('Resolution dependencies include automatic config discovery, extends, and project references', () =>
  fixture((root, put) => {
    const file = put('src/index.ts');
    const target = put('src/value.ts');
    const config = put('tsconfig.json', '{"extends":"./config/base.json","references":[{"path":"./referenced"}]}');
    const base = put('config/base.json', '{"compilerOptions":{"baseUrl":"..","paths":{"@value":["src/value.ts"]}}}');
    const referenced = put('referenced/tsconfig.json', '{"include":["./*.ts"]}');
    const resolver = new NativeModuleResolver(resolverPlan());
    assert.equal(resolver.resolveModule('@value', file)?.resolvedFileName, target);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    for (const path of [config, base, referenced]) assert.ok(dependencies.files.includes(path), path);
    assert.ok(dependencies.paths.includes(join(root, 'src/tsconfig.json')));
    const initial = resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files);
    assert.ok(initial);
    put('config/base.json', '{"compilerOptions":{"baseUrl":"..","paths":{"@value":["src/different.ts"]}}}');
    assert.notEqual(resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files), initial);
  }));

test('Native dependency fingerprints identify new configs, removed targets, and symlink redirects', () =>
  fixture((root, put) => {
    const file = put('src/index.ts');
    const first = put('targets/first.ts');
    const second = put('targets/second.ts');
    const linked = join(root, 'src/linked.ts');
    symlinkSync(first, linked);
    const resolver = new NativeModuleResolver(resolverPlan());
    assert.equal(resolver.resolveModule('./linked', file)?.resolvedFileName, first);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    assert.ok(dependencies.paths.includes(linked));
    assert.ok(dependencies.paths.includes(join(root, 'src/tsconfig.json')));
    const fingerprint = () => resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files);
    const initial = fingerprint();
    assert.ok(initial);
    assert.equal(
      resolver.resolutionDependencyFingerprint(dependencies.paths.toReversed(), dependencies.files.toReversed()),
      initial
    );
    put('src/tsconfig.json', '{}');
    assert.notEqual(fingerprint(), initial);
    rmSync(join(root, 'src/tsconfig.json'));
    assert.equal(fingerprint(), initial);
    rmSync(linked);
    symlinkSync(second, linked);
    assert.notEqual(fingerprint(), initial);
    assert.equal(resolver.resolutionDependencies().complete, false);
    rmSync(linked);
    symlinkSync(first, linked);
    assert.equal(fingerprint(), initial);
    assert.equal(resolver.resolutionDependencies().complete, true);
    rmSync(first);
    assert.notEqual(fingerprint(), initial);
    assert.equal(resolver.resolutionDependencies().complete, false);
  }));

test('Workspace export and source-map candidate probes are persistent dependencies', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('fallback.ts');
    const resolver = new NativeModuleResolver(
      resolverPlan({
        availableWorkspaceDirs: [root],
        workspaces: [
          {
            dir: root,
            sourceMaps: [{ srcDir: join(root, 'src'), outDir: join(root, 'dist') }],
            imports: encodePackageTarget(undefined),
            exports: encodePackageTarget(['./dist/missing.js', './fallback.ts']),
          },
        ],
        workspaceByPackageName: [{ name: 'workspace-package', index: 0 }],
      })
    );
    assert.equal(resolver.resolveModule('workspace-package', file)?.resolvedFileName, target);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    for (const path of ['dist/missing.js', 'src/missing.js', 'src/missing.ts', 'fallback.ts']) {
      assert.ok(dependencies.paths.includes(join(root, path)), path);
    }
    const initial = resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files);
    put('src/missing.ts');
    assert.notEqual(resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files), initial);
    assert.equal(resolver.resolutionDependencies().complete, false);
  }));

test('Dependency fingerprints retain exact path spellings independently of input order', () =>
  fixture((root, put) => {
    const source = put('actual/value.ts', 'export const value = 1;');
    const linked = join(root, 'linked');
    symlinkSync(dirname(source), linked, 'dir');
    const resolver = new NativeModuleResolver(resolverPlan());
    const paths = [linked, `${linked}/`, source, `${source}/`];
    const files = [source, `${source}/`];
    const fingerprint = resolver.resolutionDependencyFingerprint(paths, files);
    assert.ok(fingerprint);
    assert.match(fingerprint, /^2:[0-9a-f]{16}$/);
    assert.equal(resolver.resolutionDependencyFingerprint(paths.toReversed(), files.toReversed()), fingerprint);
    assert.equal(resolver.resolutionDependencyFingerprint([...paths, ...paths], [...files, ...files]), fingerprint);
    assert.notEqual(
      resolver.resolutionDependencyFingerprint([linked]),
      resolver.resolutionDependencyFingerprint([`${linked}/`])
    );
  }));

test('Dependencies survive warm backend reads and disable persistence after backend-only cache clears', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('value.ts');
    assert.equal(nativeResolverCache.resolveFile('./value', file), target);
    const resolver = new NativeModuleResolver(resolverPlan());
    assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, target);
    const dependencies = resolver.resolutionDependencies();
    assert.equal(dependencies.complete, true);
    assert.ok(dependencies.paths.includes(join(root, 'value.js')));
    assert.ok(dependencies.files.includes(join(root, 'package.json')));
    nativeResolverCache.clear();
    assert.equal(resolver.resolveModule('./value', file)?.resolvedFileName, target);
    assert.equal(resolver.resolutionDependencies().complete, false);
    const fresh = new NativeModuleResolver(resolverPlan());
    assert.equal(fresh.resolveModule('./value', file)?.resolvedFileName, target);
    assert.equal(fresh.resolutionDependencies().complete, true);
    const pnp = new NativeModuleResolver(resolverPlan({ yarnPnp: true, customCompilerExtensions: ['.vue'] }));
    assert.equal(pnp.resolutionDependencies().complete, false);
  }));
