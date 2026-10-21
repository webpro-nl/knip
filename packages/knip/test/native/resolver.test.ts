import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { nativeGetImportsAndExports, nativeGetImportsAndExportsWithResolver } from '../../src/native-analyzer.ts';
import { nativeResolverCache } from '../../src/native-resolver-cache.ts';
import {
  _resolveModuleSync,
  _createSyncModuleResolver,
  resolvePackageManifestPath,
  clearResolverCache,
} from '../../src/util/resolve.ts';
import { clearModuleResolutionCaches } from '../../src/typescript/resolve-module-names.ts';
import { getPackageNameFromFilePath } from '../../src/util/modules.ts';
import { dirname } from '../../src/util/path.ts';
import { createCustomModuleResolver } from '../reference/typescript/resolve-module-names.ts';
import { encodePackageTarget, resolverPlan } from './resolver-plan.ts';

const options = { skipTypeOnly: false, isFixExports: true, isFixTypes: true, isReportExports: true, tags: [[], []] };
function fixture(run: (root: string, put: (file: string, content?: string) => string) => void) {
  const root = realpathSync(mkdtempSync(`${tmpdir()}/knip-native-resolver-`));
  const put = (file: string, content = '') => {
    const path = `${root}/${file}`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return path;
  };
  try {
    put('package.json', '{"name":"resolver-fixture"}');
    run(root, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const capture = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error;
  }
  assert.fail('Expected an exception');
};

test('Native resolver matches the independent old wrapper and Oxc backend', () =>
  fixture((root, put) => {
    const file = put('app/index.ts');
    put('app/target.ts');
    put('app/target.js');
    put('app/style.css');
    put('app/component.vue');
    put('aliases/dep.ts');
    put('generated/app/other.ts');
    put(
      'node_modules/conditional/package.json',
      '{"name":"conditional","exports":{"import":"./import.js","require":"./require.js"}}'
    );
    put('node_modules/conditional/import.js');
    put('node_modules/conditional/require.js');
    put('node_modules/browser-only/package.json', '{"exports":{"browser":"./index.js"}}');
    put('node_modules/browser-only/index.js');
    const scopedPaths = [{ scope: root, paths: { 'alias/*suffix': [`${root}/aliases/*`] } }];
    const scopedRootDirs = [{ scope: root, rootDirs: [root, `${root}/generated`] }];
    const host = createCustomModuleResolver({ scopedPaths, scopedRootDirs }, ['.css', '.vue'], () => undefined);
    const native = new NativeModuleResolver(
      resolverPlan({
        customCompilerExtensions: ['.css', '.vue'],
        scopedPaths: [{ scope: root, paths: [{ name: 'alias/*suffix', values: [`${root}/aliases/*`] }] }],
        scopedRootDirs,
      })
    );
    for (const specifier of [
      './target',
      './target.js',
      './target?raw',
      './style.css',
      './component',
      'alias/dep',
      './other',
      'other',
      'conditional',
      'browser-only',
      'missing',
      'fs?raw',
      'node:fs',
      'bun:wrap',
      'a\0Sd800',
      'missing\ud800',
    ]) {
      assert.deepEqual(native.resolveModule(specifier, file), host(specifier, file));
      const source = `import { value } from ${JSON.stringify(specifier)}; export { value };`;
      assert.deepEqual(
        nativeGetImportsAndExportsWithResolver(file, source, native, options, false, false, []),
        nativeGetImportsAndExports(file, source, host, options, false, false, [])
      );
    }
  }));

test('Malformed package metadata uses the exact host expression and preserves encounter order', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('node_modules/.store/example/package/index.js');
    const host = createCustomModuleResolver({}, [], () => undefined);
    put('node_modules/.store/example/package/package.json', '{"name":{"startsWith":"x"}}');
    const native = new NativeModuleResolver(resolverPlan());
    const source = `import x from ${JSON.stringify(target)}; require.context('.', true, '[', 'lazy');`;
    const expected = capture(() => nativeGetImportsAndExports(file, source, host, options, false, false, ['webpack']));
    const actual = capture(() =>
      nativeGetImportsAndExportsWithResolver(file, source, native, options, false, false, ['webpack'])
    );
    assert(expected instanceof TypeError);
    assert(actual instanceof TypeError);
    assert.equal(actual.message, expected.message);
    const regexFirst = `require.context('.', true, /(/); import(${JSON.stringify(target)});`;
    const firstExpected = capture(() =>
      nativeGetImportsAndExports(file, regexFirst, host, options, false, false, ['webpack'])
    );
    const firstActual = capture(() =>
      nativeGetImportsAndExportsWithResolver(file, regexFirst, native, options, false, false, ['webpack'])
    );
    assert(firstExpected instanceof SyntaxError);
    assert(firstActual instanceof SyntaxError);
    assert.equal(firstActual.message, firstExpected.message);
  }));

test('Native cache owner shares global and context resolution while preserving clear boundaries', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const native = new NativeModuleResolver(resolverPlan());
    assert.equal(_resolveModuleSync('./later', file), undefined);
    assert.equal(native.resolveModule('./later', file), undefined);
    const target = put('later.ts');
    clearResolverCache();
    assert.equal(_resolveModuleSync('./later', file), target);
    assert.equal(native.resolveModule('./later', file), undefined);
    clearModuleResolutionCaches();
    assert.equal(native.resolveModule('./later', file)?.resolvedFileName, target);
    const vue = _createSyncModuleResolver(['.vue']);
    assert.equal(vue('./component', file), undefined);
    const component = put('component.vue');
    clearResolverCache();
    assert.equal(vue('./component', file), component);
    put('node_modules/pkg/package.json', '{"name":"pkg"}');
    assert.equal(resolvePackageManifestPath('pkg', root), `${root}/node_modules/pkg/package.json`);
  }));

test('Native source mapping retains misses across watch clears and logs before caching', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('dist/value.js');
    const plan = resolverPlan({
      availableWorkspaceDirs: [root],
      workspaces: [
        {
          dir: root,
          sourceMaps: [{ srcDir: `${root}/src`, outDir: `${root}/dist` }],
          imports: encodePackageTarget(undefined),
          exports: encodePackageTarget(undefined),
        },
      ],
    });
    const missed = new NativeModuleResolver(plan);
    assert.equal(missed.resolveModule(target, file)?.resolvedFileName, target);
    const source = put('src/value.ts');
    clearResolverCache();
    clearModuleResolutionCaches();
    assert.equal(missed.resolveModule(target, file)?.resolvedFileName, target);
    const marker = { sourceMapping: true };
    let attempts = 0;
    const native = new NativeModuleResolver(plan, (from, to) => {
      assert.equal(from, target);
      assert.equal(to, source);
      if (++attempts === 1) throw marker;
    });
    assert.equal(
      capture(() => native.resolveModule(target, file)),
      marker
    );
    assert.equal(native.resolveModule(target, file)?.resolvedFileName, source);
    assert.equal(native.resolveModule(target, file)?.resolvedFileName, source);
    assert.equal(attempts, 2);
  }));

test('Native workspace target fallback respects excluded boundaries and ordered conditions', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('source.ts');
    const exports = encodePackageTarget({ '.': { types: './absent.d.ts', default: ['./absent.js', './source.ts'] } });
    const imports = encodePackageTarget({ '#source': './source.ts' });
    const native = new NativeModuleResolver(
      resolverPlan({
        availableWorkspaceDirs: [root, `${root}/excluded`],
        workspaces: [{ dir: root, sourceMaps: [], imports, exports }],
        workspaceByPackageName: [{ name: 'workspace-package', index: 0 }],
      })
    );
    assert.equal(native.resolveModule('workspace-package', file)?.resolvedFileName, target);
    assert.equal(native.resolveModule('#source', file)?.resolvedFileName, target);
    assert.equal(native.resolveModule('#source', `${root}/excluded/index.ts`), undefined);
  }));

test('Global package attribution and native context share persistent store-name cache', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('node_modules/.store/example/package/index.js');
    const manifest = 'node_modules/.store/example/package/package.json';
    put(manifest, '{"name":"before"}');
    assert.equal(getPackageNameFromFilePath(target), 'before');
    put(manifest, '{"name":"after"}');
    nativeResolverCache.clear();
    nativeResolverCache.clearModuleCaches();
    const native = new NativeModuleResolver(resolverPlan());
    assert.equal(native.resolveModule(target, file)?.packageName, 'before');
    const second = put('node_modules/.store/other/package/index.js');
    put('node_modules/.store/other/package/package.json', '{"name":"native-first"}');
    assert.equal(native.resolveModule(second, file)?.packageName, 'native-first');
    put('node_modules/.store/other/package/package.json', '{"name":"changed"}');
    assert.equal(getPackageNameFromFilePath(second), 'native-first');
  }));

test('Native callback error state preserves thrown identity and resets between resolution and analysis', () =>
  fixture((root, put) => {
    const file = put('index.ts');
    const target = put('dist/value.js');
    const source = put('src/value.ts');
    const failures: unknown[] = [
      undefined,
      null,
      false,
      0,
      '',
      'mapping failure',
      Symbol('mapping failure'),
      {},
      new Error('mapping failure'),
    ];
    let calls = 0;
    const native = new NativeModuleResolver(
      resolverPlan({
        availableWorkspaceDirs: [root],
        workspaces: [
          {
            dir: root,
            sourceMaps: [{ srcDir: `${root}/src`, outDir: `${root}/dist` }],
            imports: encodePackageTarget(undefined),
            exports: encodePackageTarget(undefined),
          },
        ],
      }),
      (from, to) => {
        assert.equal(from, target);
        assert.equal(to, source);
        const index = calls++;
        if (index < failures.length) throw failures[index];
      }
    );
    for (let index = 0; index < failures.length; index++) {
      const actual = capture(() =>
        index % 2 === 0
          ? native.resolveModule(target, file)
          : nativeGetImportsAndExportsWithResolver(
              file,
              `import ${JSON.stringify(target)};`,
              native,
              options,
              false,
              false,
              []
            )
      );
      assert.equal(actual, failures[index]);
      assert.equal(calls, index + 1);
    }
    assert.equal(native.resolveModule(target, file)?.resolvedFileName, source);
    assert.equal(native.resolveModule(target, file)?.resolvedFileName, source);
    assert.equal(calls, failures.length + 1);
    const error = capture(() =>
      nativeGetImportsAndExportsWithResolver(file, 'require.context(".", true, /(/);', native, options, false, false, [
        'webpack',
      ])
    );
    assert(error instanceof SyntaxError);
  }));
