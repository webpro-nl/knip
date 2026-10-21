import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { nativeResolverCache } from '../../src/native-resolver-cache.ts';
import { nativeGetImportsAndExports, nativeGetImportsAndExportsWithResolver } from '../../src/native-analyzer.ts';
import { main } from '../../src/index.ts';
import { dirname, toPosix } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { _getImportsAndExports } from '../reference/typescript/get-imports-and-exports.ts';
import { createCustomModuleResolver } from '../reference/typescript/resolve-module-names.ts';
import { buildVisitor } from '../reference/typescript/visitors/walk.ts';
import {
  _resolveModuleSync,
  _createSyncModuleResolver,
  resolvePackageManifestPath,
} from '../reference/util/resolve.ts';
import { resolverPlan } from './resolver-plan.ts';

function fixture<T>(run: (root: string, put: (file: string, content?: string) => string) => T) {
  const root = toPosix(realpathSync(mkdtempSync(`${tmpdir()}/knip-resolver-utf16-`)));
  const put = (file: string, content = '') => {
    const path = `${root}/${file}`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return path;
  };
  put('package.json', '{}');
  return Promise.resolve()
    .then(() => run(root, put))
    .finally(() => rmSync(root, { recursive: true, force: true }));
}

const names = [
  ['\ud800X', '\ufffdX', '\u{10058}'],
  ['\udfffX', '\ufffdX', '\u{10fc58}'],
  ['\ud800', '\ufffd', '\u{10000}'],
  ['\ud800\ud800\udc00\udc00', '\ufffd\u{10000}\ufffd', '\u{10000}\u{10000}'],
  ['é🍎�', 'é🍎�', 'é🍎�'],
];
const options = { skipTypeOnly: false, isFixExports: true, isFixTypes: true, isReportExports: true, tags: [[], []] };

test('Resolver backend converts UTF-16 specifiers and containing paths like the loaded Oxc binding', () =>
  fixture((root, put) => {
    const file = put('entry.ts');
    put('target.ts');
    const host = createCustomModuleResolver({}, [], () => undefined);
    const native = new NativeModuleResolver(resolverPlan());
    for (const [input, lossy, wasi] of names) {
      put(`${lossy}.ts`);
      put(`${wasi}.ts`);
      put(`${lossy}/target.ts`);
      put(`${wasi}/target.ts`);
      for (const [specifier, containingFile] of [
        [`./${input}`, file],
        ['./target', `${root}/${input}/entry.ts`],
      ]) {
        const expected = _resolveModuleSync(specifier, containingFile);
        assert(expected);
        assert.equal(nativeResolverCache.resolveFile(specifier, containingFile), expected);
        assert.deepEqual(native.resolveModule(specifier, containingFile), host(specifier, containingFile));
      }
      const source = `require(${JSON.stringify(`./${input}`)});`;
      assert.deepEqual(
        nativeGetImportsAndExportsWithResolver(file, source, native, options, false, false, []),
        nativeGetImportsAndExports(file, source, host, options, false, false, [])
      );
    }
  }));

test('Resolver backend converts custom extensions and manual tsconfig options at the binding boundary', () =>
  fixture((root, put) => {
    const file = put('entry.ts');
    for (const [input, lossy, wasi] of names) {
      put(`component.${lossy}`);
      put(`component.${wasi}`);
      const extensions = [`.${input}`];
      const expected = _createSyncModuleResolver(extensions)('./component', file);
      assert(expected);
      assert.equal(
        nativeResolverCache.createFileResolver(extensions, undefined, false).resolveFile('./component', file),
        expected
      );
      const host = createCustomModuleResolver({}, extensions, () => undefined);
      const native = new NativeModuleResolver(resolverPlan({ customCompilerExtensions: extensions }));
      assert.deepEqual(native.resolveModule('./component', file), host('./component', file));
    }
    put('lossy-target.ts');
    put('wasi-target.ts');
    put('config-�X.json', '{"compilerOptions":{"paths":{"mapped":["./lossy-target.ts"]}}}');
    put('config-\u{10058}.json', '{"compilerOptions":{"paths":{"mapped":["./wasi-target.ts"]}}}');
    const config = `${root}/config-\ud800X.json`;
    const expected = _createSyncModuleResolver(['.ts'], config)('mapped', file);
    assert(expected);
    assert.equal(nativeResolverCache.createFileResolver(['.ts'], config, false).resolveFile('mapped', file), expected);
    const host = createCustomModuleResolver({}, [], () => undefined, undefined, config);
    const native = new NativeModuleResolver(resolverPlan({ tsConfigFile: config }));
    assert.deepEqual(native.resolveModule('mapped', file), host('mapped', file));
  }));

test('Resolver manifest lookups and attributed package names preserve the original UTF-16 request', () =>
  fixture((root, put) => {
    const file = put('entry.ts');
    for (const name of ['pkg-�X', 'pkg-\u{10058}']) {
      put(`node_modules/${name}/package.json`, '{"main":"index.js"}');
      put(`node_modules/${name}/index.js`);
      put(`${name}/node_modules/dep/package.json`, '{}');
    }
    const input = 'pkg-\ud800X';
    const expected = resolvePackageManifestPath(input, root);
    assert(expected);
    assert.equal(nativeResolverCache.resolvePackageManifestPath(input, root), expected);
    const directory = `${root}/${input}`;
    assert.equal(
      nativeResolverCache.resolvePackageManifestPath('dep', directory),
      resolvePackageManifestPath('dep', directory)
    );
    const host = createCustomModuleResolver({}, [], () => undefined);
    const native = new NativeModuleResolver(resolverPlan());
    const module = host(input, file);
    assert(module);
    assert.equal(module.packageName, input);
    assert.deepEqual(native.resolveModule(input, file), module);
    assert.deepEqual(native.resolveModule('pkg-\u{10058}', file), host('pkg-\u{10058}', file));
    assert.equal(native.resolveModule(input, file)?.packageName, input);
    put('node_modules/pkg-�/package.json', '{}');
    put('node_modules/pkg-\u{1002f}package.json', '{}');
    assert.equal(
      nativeResolverCache.resolvePackageManifestPath('pkg-\ud800', root),
      resolvePackageManifestPath('pkg-\ud800', root)
    );
  }));

test('Wrapper directory caches and scoped mappings keep UTF-16 keys before backend conversion', () =>
  fixture((root, put) => {
    const first = put('first.ts');
    const second = put('second.ts');
    const files = [`${root}/\ud800X/entry.ts`, `${root}/\u{10058}/entry.ts`];
    const scopes = [dirname(files[0]), dirname(files[1])];
    const scopedPaths = [
      { scope: scopes[0], paths: { alias: [first] } },
      { scope: scopes[1], paths: { alias: [second] } },
    ];
    const host = createCustomModuleResolver({ scopedPaths }, [], () => undefined);
    const native = new NativeModuleResolver(
      resolverPlan({
        scopedPaths: [
          { scope: scopes[0], paths: [{ name: 'alias', values: [first] }] },
          { scope: scopes[1], paths: [{ name: 'alias', values: [second] }] },
        ],
      })
    );
    for (const file of [...files, ...files]) {
      const expected = host('alias', file);
      assert(expected);
      assert.deepEqual(native.resolveModule('alias', file), expected);
    }
  }));

test('Resolver callback results retain UTF-16 values without backend input conversion', () => {
  const file = '/workspace/entry.ts';
  const source = 'require("./target");';
  for (const [input] of names) {
    for (const external of [false, true]) {
      const resolve = () => ({
        resolvedFileName: `/workspace/${input}.ts`,
        isExternalLibraryImport: external,
        packageName: external ? `pkg-${input}` : undefined,
      });
      const expected = _getImportsAndExports(file, source, resolve, options, false, false, buildVisitor([], false), {
        filePath: '',
        sourceText: '',
        addScript() {},
        addImport() {},
        markImportExpressionHandled() {},
        addImportGlob() {},
        markExportRegistered() {},
      });
      assert.deepEqual(nativeGetImportsAndExports(file, source, resolve, options, false, false, []), expected);
    }
  }
});

test('Production graph follows escaped surrogate imports using the resolver binding conversion', () =>
  fixture(async (root, put) => {
    const file = put('entry.ts', "require('./\\uD800X');");
    put('knip.json', '{"entry":["entry.ts"],"project":["*.ts"]}');
    const candidates = [put('�X.ts'), put('\u{10058}.ts')];
    const expected = _resolveModuleSync('./\ud800X', file);
    assert(expected);
    const { counters, issues } = await main(
      await createOptions({ cwd: root, includedIssueTypes: ['files', 'unresolved'] })
    );
    assert.equal(counters.unresolved, 0);
    assert.deepEqual(
      Object.keys(issues.files),
      candidates.filter(path => path !== expected).map(path => path.slice(root.length + 1))
    );
  }));
