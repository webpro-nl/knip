import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { GraphCacheConsultant } from '../../src/CacheConsultant.ts';
import { ConfigurationChief } from '../../src/ConfigurationChief.ts';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { getIncludedCompilers } from '../../src/compilers/index.ts';
import type { Compiler } from '../../src/compilers/types.ts';
import { NativeModuleResolver, createNativeResolverPlan } from '../../src/native-module-resolver.ts';
import { createNativeResolverCache } from '../../src/native-resolver-cache.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const analysis: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: false,
  isFixTypes: false,
  isReportExports: true,
  tags: [[], []],
};

async function fixture(t: TestContext, cache = true) {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-principal-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'package.json'), '{}');
  const options = await createOptions({
    cwd,
    args: { cache, 'cache-location': join(cwd, '.cache') },
    isSession: true,
  });
  const chief = new ConfigurationChief(options);
  await chief.getWorkspaces();
  const createPrincipal = () =>
    new ProjectPrincipal(
      options,
      path => path,
      undefined,
      () => '.'
    );
  return { cwd, chief, createPrincipal };
}

test('Config dependency closure is complete before any project files are visited', async t => {
  const { cwd, chief, createPrincipal } = await fixture(t);
  const entry = join(cwd, 'entry.foo');
  const first = join(cwd, 'first.config.ts');
  const later = join(cwd, 'later.config.ts');
  const settings = join(cwd, 'settings.ts');
  writeFileSync(entry, 'export const fruit = 1;');
  writeFileSync(first, 'export { target } from "./settings.ts";');
  writeFileSync(later, 'export { target } from "./first.config.ts";');
  writeFileSync(settings, 'export const target = "apple";');
  let calls = 0;
  const compiler: Compiler = Object.assign(
    (source: string) => {
      calls++;
      return source;
    },
    { cacheKey: 'source-v1' }
  );
  const analyze = async () => {
    const principal = createPrincipal();
    principal.addCompilers('.', new Map([['.foo', compiler]]));
    principal.addEntryPath(entry);
    principal.initNative(chief, false, analysis, [first, later]);
    await principal.walkAndAnalyze((filePath, _parsed, source, cached) => {
      principal.analyzeSourceFile(filePath, source, analysis, false, undefined, cached);
      return undefined;
    }, analysis);
    principal.reconcileCache(new Map());
  };
  await analyze();
  await analyze();
  assert.equal(calls, 1);
  writeFileSync(settings, 'export const target = "banana";');
  await analyze();
  assert.equal(calls, 2);
});

test('Source-only built-in compilers reuse analysis without a configuration file', async t => {
  const { cwd, chief, createPrincipal } = await fixture(t);
  const entry = join(cwd, 'entry.mdx');
  writeFileSync(entry, 'import fruit from "./fruit.ts";');
  writeFileSync(join(cwd, 'fruit.ts'), 'export default "apple";');
  const analyze = async (warm: boolean) => {
    const principal = createPrincipal();
    principal.addCompilers('.', getIncludedCompilers(new Map([['.mdx', true]]), new Set()));
    principal.addEntryPath(entry);
    principal.initNative(chief, false, analysis, []);
    if (warm) {
      principal.fileManager.loadSourceText = () => {
        assert.fail('A warm built-in compiler should reuse the persisted analysis');
      };
    }
    let analyzed = 0;
    await principal.walkAndAnalyze((filePath, _parsed, source, cached) => {
      assert.equal(!!cached, warm);
      const file = principal.analyzeSourceFile(filePath, source, analysis, false, undefined, cached);
      assert.equal(file.imports.internal.has(join(cwd, 'fruit.ts')), true);
      analyzed++;
      return undefined;
    }, analysis);
    assert.equal(analyzed, 1);
    principal.reconcileCache(new Map());
  };
  await analyze(false);
  await analyze(true);
});

test('Uncached analysis skips cache context and resolution dependency fingerprint work', async t => {
  const { cwd, chief, createPrincipal } = await fixture(t, false);
  const principal = createPrincipal();
  const entry = join(cwd, 'entry.foo');
  writeFileSync(entry, 'export const fruit = 1;');
  const context = GraphCacheConsultant.prototype.setContext;
  const dependencies = NativeModuleResolver.prototype.resolutionDependencies;
  t.after(() => {
    GraphCacheConsultant.prototype.setContext = context;
    NativeModuleResolver.prototype.resolutionDependencies = dependencies;
  });
  GraphCacheConsultant.prototype.setContext = () => assert.fail('Uncached analysis constructed cache context');
  NativeModuleResolver.prototype.resolutionDependencies = () =>
    assert.fail('Uncached analysis collected resolution fingerprints');
  const compiler: Compiler = Object.assign((source: string) => source, {
    cacheKey: () => assert.fail('Uncached analysis evaluated a compiler cache key'),
  });
  principal.addCompilers('.', new Map([['.foo', compiler]]));
  principal.addEntryPath(entry);
  principal.initNative(chief, false, analysis, []);
  let analyzed = 0;
  await principal.walkAndAnalyze((filePath, _parsed, source, cached) => {
    const file = principal.analyzeSourceFile(filePath, source, analysis, false, undefined, cached);
    assert.equal(file.exports.has('fruit'), true);
    analyzed++;
    return undefined;
  }, analysis);
  principal.reconcileCache(new Map());
  assert.equal(analyzed, 1);
});

test('An isolated resolver cannot seed missing-file probes in traversal backends', async t => {
  const { cwd, chief } = await fixture(t);
  const importer = join(cwd, 'index.ts');
  const initialTarget = join(cwd, 'target.ts');
  const generatedTarget = join(cwd, 'target.js');
  writeFileSync(importer, 'import "./target";');
  writeFileSync(initialTarget, 'export const fruit = "apple";');
  const plan = createNativeResolverPlan(chief, new Map(), new Map(), []);
  const traversal = new NativeModuleResolver(plan);
  const isolated = new NativeModuleResolver(plan, undefined, createNativeResolverCache());
  assert.equal(isolated.resolveModule('./target', importer)?.resolvedFileName, initialTarget);
  writeFileSync(generatedTarget, 'export const fruit = "banana";');
  assert.equal(traversal.resolveModule('./target', importer)?.resolvedFileName, generatedTarget);
});
