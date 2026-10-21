import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { ConfigurationChief } from '../../src/ConfigurationChief.ts';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { nativeGetImportsAndExports } from '../../src/native-analyzer.ts';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import type { FileNode } from '../../src/types/module-graph.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const analysis: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: false,
  isFixTypes: false,
  isReportExports: true,
  tags: [[], []],
};

async function fixture() {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-project-walk-')));
  writeFileSync(join(cwd, 'package.json'), '{}');
  writeFileSync(join(cwd, 'knip.json'), '{}');
  const options = await createOptions({ cwd, args: { cache: true, 'cache-location': join(cwd, '.cache') } });
  const chief = new ConfigurationChief(options);
  await chief.getWorkspaces();
  const createPrincipal = () =>
    new ProjectPrincipal(
      options,
      path => path,
      undefined,
      path => chief.findWorkspaceByFilePath(path)?.name
    );
  return {
    cwd,
    chief,
    principal: createPrincipal(),
    createPrincipal,
    dispose: () => rmSync(cwd, { recursive: true, force: true }),
  };
}

test('Native walk keeps cold-file callback errors isolated and continues in order', async () => {
  const { cwd, chief, principal, dispose } = await fixture();
  try {
    const paths = ['first', 'second', 'third', 'fourth'].map(name => join(cwd, `${name}.ts`));
    for (const path of paths) writeFileSync(path, 'export const value = true;');
    principal.addEntryPaths(paths);
    principal.initNative(chief, false, analysis, []);
    const visited: string[] = [];
    await principal.walkAndAnalyze((path, _parsed, _source, file) => {
      assert.ok(file);
      visited.push(path);
      if (path === paths[0]) throw new Error('graph enrichment failed');
      return undefined;
    }, analysis);
    assert.deepEqual(visited, paths);
  } finally {
    dispose();
  }
});

for (const mode of ['batch', 'serial']) {
  test(`${mode} walk does not reuse fresh analysis after graph enrichment fails`, async () => {
    const { cwd, chief, createPrincipal, dispose } = await fixture();
    try {
      const failed = join(cwd, 'failed.ts');
      const successful = join(cwd, 'successful.ts');
      const paths = [failed, successful];
      for (const path of paths) writeFileSync(path, 'export const value = true;');
      const create = () => {
        const principal = createPrincipal();
        principal.addEntryPaths(paths);
        principal.initNative(chief, false, analysis, []);
        principal.cache.setContext('project-walk-callback-errors');
        return principal;
      };
      const walk = async (principal: ProjectPrincipal) => {
        const visited: string[] = [];
        const graph = new Map<string, FileNode>();
        await principal.walkAndAnalyze(
          (path, parsed, source, cached) => {
            const file = principal.analyzeSourceFile(path, source, analysis, false, parsed, cached);
            visited.push(path);
            if (path === failed) throw new Error('graph enrichment failed');
            graph.set(path, file);
            return undefined;
          },
          mode === 'batch' ? analysis : undefined
        );
        assert.deepEqual(visited, paths);
        assert.equal(graph.get(successful)?.exports.has('value'), true);
        principal.reconcileCache(graph);
      };
      const cold = create();
      await walk(cold);
      const warm = create();
      assert.equal(warm.cache.getCachedFile(successful)?.exports.has('value'), true);
      await walk(warm);
      assert.equal(cold.cache.getCachedFile(failed), undefined);
      assert.equal(warm.cache.getCachedFile(failed), undefined);
      const reopened = create();
      assert.equal(reopened.cache.getCachedFile(failed), undefined);
      assert.equal(reopened.cache.getCachedFile(successful)?.exports.has('value'), true);
    } finally {
      dispose();
    }
  });

  test(`${mode} walk preserves callback errors from successful cache hits`, async () => {
    const { cwd, chief, principal, createPrincipal, dispose } = await fixture();
    try {
      const paths = [join(cwd, 'first.ts'), join(cwd, 'second.ts')];
      for (const path of paths) writeFileSync(path, 'export const value = true;');
      principal.addEntryPaths(paths);
      principal.initNative(chief, false, analysis, []);
      principal.cache.setContext('project-walk-callback-errors');
      const graph = new Map<string, FileNode>();
      await principal.walkAndAnalyze(
        (path, parsed, source, cached) => {
          graph.set(path, principal.analyzeSourceFile(path, source, analysis, false, parsed, cached));
          return undefined;
        },
        mode === 'batch' ? analysis : undefined
      );
      principal.reconcileCache(graph);
      const warm = createPrincipal();
      warm.addEntryPaths(paths);
      warm.initNative(chief, false, analysis, []);
      warm.cache.setContext('project-walk-callback-errors');
      assert.ok(warm.cache.getCachedFile(paths[0]));
      const visited: string[] = [];
      const failure = new Error('cached graph enrichment failed');
      await assert.rejects(
        warm.walkAndAnalyze(
          path => {
            visited.push(path);
            throw failure;
          },
          mode === 'batch' ? analysis : undefined
        ),
        error => error === failure
      );
      assert.deepEqual(visited, [paths[0]]);
      assert.ok(warm.cache.getCachedFile(paths[0]));
    } finally {
      dispose();
    }
  });
}

test('Native walk recovers an unavailable batch through ordered serial analysis', async () => {
  const { cwd, chief, principal, dispose } = await fixture();
  const original = NativeModuleResolver.prototype.analyzeFiles;
  try {
    const paths = ['first', 'second'].map(name => join(cwd, `${name}.ts`));
    for (const path of paths) writeFileSync(path, `export const value = ${JSON.stringify(path)};`);
    principal.addEntryPaths(paths);
    principal.initNative(chief, false, analysis, []);
    let batchCalls = 0;
    NativeModuleResolver.prototype.analyzeFiles = () => {
      batchCalls++;
      throw new Error('batch failed');
    };
    const visited: string[] = [];
    await principal.walkAndAnalyze((path, _parsed, source) => {
      assert.ok(source.includes(JSON.stringify(path)));
      visited.push(path);
      return undefined;
    }, analysis);
    assert.equal(batchCalls, 1);
    assert.deepEqual(visited, paths);
  } finally {
    NativeModuleResolver.prototype.analyzeFiles = original;
    dispose();
  }
});

test('Cached compiler files remain barriers when an earlier file changes their entry policy', async () => {
  const { cwd, chief, principal, dispose } = await fixture();
  try {
    const first = join(cwd, 'first.ts');
    const compiler = join(cwd, 'bridge.foo');
    const last = join(cwd, 'last.ts');
    writeFileSync(first, 'export const first = true;');
    writeFileSync(compiler, 'bridge');
    writeFileSync(last, 'export const before = true;');
    let compilerCalls = 0;
    principal.addCompilers(
      '.',
      new Map([
        [
          '.foo',
          () => {
            compilerCalls++;
            writeFileSync(last, 'export const after = true;');
            return 'export const bridge = true;';
          },
        ],
      ])
    );
    principal.addEntryPaths([first, compiler, last]);
    principal.initNative(chief, false, analysis, []);
    principal.cache.setCachedFile(
      compiler,
      nativeGetImportsAndExports(compiler, 'export const bridge = true;', () => undefined, analysis, false, false)
    );
    const visited: string[] = [];
    let lastExports: string[] | undefined;
    await principal.walkAndAnalyze((path, _parsed, _source, file) => {
      visited.push(path);
      if (path === first) principal.addEntryPath(compiler, { skipExportsAnalysis: true });
      if (path === last) lastExports = file && [...file.exports.keys()];
      return undefined;
    }, analysis);
    assert.equal(compilerCalls, 1);
    assert.deepEqual(visited, [first, compiler, last]);
    assert.deepEqual(lastExports, ['after']);
  } finally {
    dispose();
  }
});
