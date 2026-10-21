import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JSONReport } from '../../src/reporters/json.ts';
import { join } from '../../src/util/path.ts';

const cli = fileURLToPath(new URL('../../src/cli.ts', import.meta.url));

function fixture(t: TestContext) {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-compiler-cache-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'package.json'), '{"type":"module"}');
  writeFileSync(join(cwd, 'src/index.ts'), 'import "./selection.foo";');
  writeFileSync(join(cwd, 'src/selection.foo'), 'apple');
  writeFileSync(join(cwd, 'src/fruits.ts'), 'export const apple = 1; export const banana = 2;');

  const analyze = (target: string, cache = true) => {
    const result = spawnSync(
      process.execPath,
      [cli, '--reporter', 'json', '--no-progress', ...(cache ? ['--cache'] : [])],
      { cwd, env: { ...process.env, TARGET: target }, encoding: 'utf8', timeout: 10_000 }
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, result.stderr);
    const report: JSONReport = JSON.parse(result.stdout);
    return report;
  };
  const unused = (report: JSONReport) => report.issues.find(issue => issue.file === 'src/fruits.ts')?.exports;
  const configure = (compiler: string) =>
    writeFileSync(
      join(cwd, 'knip.ts'),
      `${compiler}\nexport default { entry: ['src/index.ts'], project: ['src/**'], compilers: { foo: compiler } };`
    );
  return { cwd, analyze, unused, configure };
}

test('Custom compiler closures are rerun when environment changes without a cache key', t => {
  const { analyze, unused, configure } = fixture(t);
  configure(`const target = process.env.TARGET;
    const compiler = () => 'import { ' + target + ' } from "./fruits.ts"; console.log(' + target + ');';`);
  assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
  const updated = analyze('banana');
  assert.equal(unused(updated)?.[0].name, 'apple');
  assert.deepEqual(updated, analyze('banana', false));
});

for (const cacheKey of ['target', '() => target']) {
  test(`Custom compiler cache key ${cacheKey} preserves reuse and invalidates changed state`, t => {
    const { cwd, analyze, unused, configure } = fixture(t);
    configure(`import { appendFileSync } from 'node:fs';
      const target = process.env.TARGET;
      const compiler = Object.assign((_source: string, path: string) => {
        appendFileSync(path + '.calls', target + '\\n');
        return 'import { ' + target + ' } from "./fruits.ts"; console.log(' + target + ');';
      }, { cacheKey: ${cacheKey} });`);
    assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
    assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
    assert.equal(readFileSync(join(cwd, 'src/selection.foo.calls'), 'utf8'), 'apple\n');
    assert.equal(unused(analyze('banana'))?.[0].name, 'apple');
    assert.equal(readFileSync(join(cwd, 'src/selection.foo.calls'), 'utf8'), 'apple\nbanana\n');
  });
}

test('Compiler cache follows transitive config helpers outside the project glob', t => {
  const { cwd, analyze, unused, configure } = fixture(t);
  mkdirSync(join(cwd, 'tools'));
  configure(`import { compiler } from './tools/compiler.ts';`);
  writeFileSync(
    join(cwd, 'tools/compiler.ts'),
    `import { target } from './settings.ts';
     export const compiler = Object.assign(() =>
       'import { ' + target + ' } from "./fruits.ts"; console.log(' + target + ');', { cacheKey: 'v1' });`
  );
  const settings = join(cwd, 'tools/settings.ts');
  writeFileSync(settings, 'export const target = "apple";');
  assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
  writeFileSync(settings, 'export const target = "banana";');
  const updated = analyze('apple');
  assert.equal(unused(updated)?.[0].name, 'apple');
  assert.deepEqual(updated, analyze('apple', false));
});

test('Compiler cache never treats a package declaration as its implementation', t => {
  const { cwd, analyze, unused, configure } = fixture(t);
  const packageDir = join(cwd, 'node_modules/fixture-compiler');
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    join(packageDir, 'package.json'),
    JSON.stringify({ name: 'fixture-compiler', type: 'module', main: './index.js', types: './index.d.ts' })
  );
  writeFileSync(join(packageDir, 'index.d.ts'), 'export declare const target: string;');
  configure(`import { target } from 'fixture-compiler';
    const compiler = Object.assign(() =>
      'import { ' + target + ' } from "./fruits.ts"; console.log(' + target + ');', { cacheKey: 'v1' });`);
  writeFileSync(join(packageDir, 'index.js'), 'export const target = "apple";');
  assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
  writeFileSync(join(packageDir, 'index.js'), 'export const target = "banana";');
  const updated = analyze('apple');
  assert.equal(unused(updated)?.[0].name, 'apple');
  assert.deepEqual(updated, analyze('apple', false));
});

for (const keyedCompiler of [false, true]) {
  test(`Cold cache preserves compiler barriers before config-helper resolution (keyed compiler: ${keyedCompiler})`, t => {
    const { cwd, analyze, unused } = fixture(t);
    rmSync(join(cwd, 'src/index.ts'));
    mkdirSync(join(cwd, 'tools'));
    mkdirSync(join(cwd, 'dist'));
    writeFileSync(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { rootDir: 'src', outDir: 'dist' } }));
    writeFileSync(join(cwd, 'dist/value.js'), 'import { apple } from "../src/fruits.ts"; export const value = apple;');
    writeFileSync(
      join(cwd, 'tools/helper.ts'),
      'import { value } from "../dist/value.js"; export const helper = value;'
    );
    writeFileSync(
      join(cwd, 'knip.ts'),
      `import { writeFileSync } from 'node:fs';
       import { dirname, join } from 'node:path';
       import { helper } from './tools/helper.ts';
       void helper;
       export default {
         entry: ['src/selection.foo'], project: ['src/**', 'dist/**'],
         compilers: {
           foo: (_source: string, path: string) => {
             writeFileSync(join(dirname(path), 'value.ts'), 'export const value = 2;');
             return 'import "./fruits.ts";';
           },
           ${keyedCompiler ? "bar: Object.assign((source: string) => source, { cacheKey: 'v1' })," : ''}
         },
       };`
    );
    const uncached = analyze('apple', false);
    assert.deepEqual(
      unused(uncached)?.map(item => item.name),
      ['apple', 'banana']
    );
    assert.ok(uncached.issues.find(issue => issue.file === 'dist/value.js')?.files?.length);
    rmSync(join(cwd, 'src/value.ts'));
    assert.deepEqual(analyze('apple'), uncached);
  });
}

test('Compiler cache rejects config dependencies changed after the initial scan', t => {
  const { cwd, analyze, unused, configure } = fixture(t);
  mkdirSync(join(cwd, 'tools'));
  writeFileSync(join(cwd, 'tools/settings.ts'), 'export const target = "apple";');
  configure(`import { writeFileSync } from 'node:fs';
    import { target } from './tools/settings.ts';
    const compiler = Object.assign(() => {
      writeFileSync(new URL('./tools/settings.ts', import.meta.url), 'export const target = "banana";');
      return 'import { ' + target + ' } from "./fruits.ts"; console.log(' + target + ');';
    }, { cacheKey: 'v1' });`);
  assert.equal(unused(analyze('apple'))?.[0].name, 'banana');
  const updated = analyze('apple');
  assert.equal(unused(updated)?.[0].name, 'apple');
  assert.deepEqual(updated, analyze('apple', false));
});

for (const keyedCompiler of [false, true]) {
  test(`Cold cache preserves extension precedence after compiler file creation (keyed compiler: ${keyedCompiler})`, t => {
    const { cwd, analyze, unused } = fixture(t);
    rmSync(join(cwd, 'src/index.ts'));
    mkdirSync(join(cwd, 'tools/generated'), { recursive: true });
    writeFileSync(
      join(cwd, 'tools/generated/target.ts'),
      'import { apple } from "../../src/fruits.ts"; export const value = apple;'
    );
    writeFileSync(
      join(cwd, 'tools/helper.ts'),
      'import { value } from "./generated/target"; export const helper = value;'
    );
    writeFileSync(
      join(cwd, 'knip.ts'),
      `import { writeFileSync } from 'node:fs';
       import { dirname, join } from 'node:path';
       import { helper } from './tools/helper.ts';
       void helper;
       export default {
         entry: ['src/selection.foo'], project: ['src/**', 'tools/**'],
         compilers: {
           foo: (_source: string, path: string) => {
             writeFileSync(join(dirname(path), '../tools/generated/target.js'), 'export const value = 2;');
             return 'import "./fruits.ts";';
           },
           ${keyedCompiler ? "bar: Object.assign((source: string) => source, { cacheKey: 'v1' })," : ''}
         },
       };`
    );
    const uncached = analyze('apple', false);
    assert.deepEqual(
      unused(uncached)?.map(item => item.name),
      ['apple', 'banana']
    );
    assert.ok(uncached.issues.find(issue => issue.file === 'tools/generated/target.ts')?.files?.length);
    rmSync(join(cwd, 'tools/generated/target.js'));
    assert.deepEqual(analyze('apple'), uncached);
  });
}
