import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import type { ParsedCLIArgs } from '../../src/util/cli-arguments.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { exec } from '../helpers/exec.ts';

const setup = () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-configuration-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async (args: Partial<ParsedCLIArgs> = {}) =>
    main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation, ...args } }));
  const cleanup = () => {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  };
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  return { cwd, run, cleanup };
};

test('Cached files are re-analyzed when ignoreExportsUsedInFile changes', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { apple } from './fruits';\nconsole.log(apple);\n");
  writeFileSync(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const pear = 2;\nconsole.log(pear);\n');
  writeFileSync(join(cwd, 'knip.json'), '{}');

  try {
    assert.equal((await run()).counters.exports, 1);

    writeFileSync(join(cwd, 'knip.json'), '{"ignoreExportsUsedInFile":true}');
    assert.equal((await run()).counters.exports, 0);

    writeFileSync(join(cwd, 'knip.json'), '{}');
    assert.equal((await run()).counters.exports, 1);
  } finally {
    cleanup();
  }
});

test('Files reached but not analyzed are not served from the cache once they become project files', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'src/legacy'), { recursive: true });
  writeFileSync(join(cwd, 'index.ts'), "import { apple } from './src/legacy/apple';\nconsole.log(apple);\n");
  writeFileSync(
    join(cwd, 'src/legacy/apple.ts'),
    "import { pear } from './pear';\nexport const apple = pear;\nexport const seed = 2;\n"
  );
  writeFileSync(join(cwd, 'src/legacy/pear.ts'), 'export const pear = 1;\n');
  writeFileSync(join(cwd, 'knip.json'), '{"project":["**/*.ts","!src/legacy/**"]}');

  try {
    const cold = await run();
    assert.equal(cold.counters.files, 0);
    assert.equal(cold.counters.exports, 0);

    writeFileSync(join(cwd, 'knip.json'), '{"project":["**/*.ts"]}');

    const warm = await run();
    assert.equal(warm.counters.files, 0);
    assert.equal(warm.counters.exports, 1);
    assert.deepEqual(Object.keys(warm.issues.exports['src/legacy/apple.ts']), ['seed']);
  } finally {
    cleanup();
  }
});

test('Cached files carry fix positions after a run that collected none', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { apple } from './fruits';\nconsole.log(apple);\n");
  writeFileSync(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const pear = 2;\n');

  try {
    assert.equal((await run({ 'fix-type': ['dependencies'] })).counters.exports, 1);

    await run({ fix: true });
    assert.equal(readFileSync(join(cwd, 'fruits.ts'), 'utf8'), 'export const apple = 1;\nconst pear = 2;\n');
  } finally {
    cleanup();
  }
});

test('Cached files are re-analyzed when an unresolved import target is no longer gitignored', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'gen'));
  writeFileSync(join(cwd, '.gitignore'), 'gen\n');
  writeFileSync(join(cwd, 'index.ts'), "import { output } from './gen/output';\nconsole.log(output);\n");

  try {
    assert.equal((await run()).counters.unresolved, 0);

    writeFileSync(join(cwd, '.gitignore'), '\n');

    assert.equal((await run()).counters.unresolved, 1);
  } finally {
    cleanup();
  }
});

test('Cached files are re-analyzed when a custom compiler changes', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-compiler-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const config = (compiled: string) => `export default { compilers: { foo: (text: string) => ${compiled} } };\n`;
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  writeFileSync(join(cwd, 'index.ts'), "import './styles.foo';\n");
  writeFileSync(join(cwd, 'styles.foo'), '@import "./apple";\n');
  writeFileSync(join(cwd, 'apple.ts'), 'export const apple = 1;\n');
  writeFileSync(join(cwd, 'knip.ts'), config("[...text.matchAll(/(?<=@)import[^;]+/g)].join('\\n')"));
  const command = `knip --no-progress --files --cache --cache-location ${cacheLocation}`;

  try {
    const cold = exec(command, { cwd });
    assert.equal(cold.stdout, '');
    assert.equal(cold.status, 0);

    writeFileSync(join(cwd, 'knip.ts'), config("''"));

    const warm = exec(command, { cwd });
    assert.match(warm.stdout, /apple\.ts/);
    assert.equal(warm.status, 1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});

test('Cached files are re-analyzed when a workspace package is renamed', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-rename-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  mkdirSync(join(cwd, 'packages/apples'), { recursive: true });
  mkdirSync(join(cwd, 'packages/pears/src'), { recursive: true });
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","workspaces":["packages/*"]}');
  writeFileSync(join(cwd, 'knip.json'), '{"includeEntryExports":true}');
  writeFileSync(join(cwd, 'packages/apples/package.json'), '{"name":"apples","dependencies":{"pears":"*"}}');
  writeFileSync(join(cwd, 'packages/apples/index.ts'), "import { pear } from 'pears';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","exports":"./src/index.ts"}');
  writeFileSync(join(cwd, 'packages/pears/src/index.ts'), 'export const pear = 1;\n');
  const command = `knip --no-progress --exports --cache --cache-location ${cacheLocation}`;

  try {
    const cold = exec(command, { cwd });
    assert.equal(cold.stdout, '');
    assert.equal(cold.status, 0);

    writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"plums","exports":"./src/index.ts"}');

    const warm = exec(command, { cwd });
    assert.match(warm.stdout, /pear\s+packages\/pears\/src\/index\.ts/);
    assert.equal(warm.status, 1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});

test('Cached files are re-analyzed when a workspace package changes its exports', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-exports-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  mkdirSync(join(cwd, 'packages/apples'), { recursive: true });
  mkdirSync(join(cwd, 'packages/pears'), { recursive: true });
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","workspaces":["packages/*"]}');
  writeFileSync(join(cwd, 'packages/apples/package.json'), '{"name":"apples","dependencies":{"pears":"*"}}');
  writeFileSync(join(cwd, 'packages/apples/index.ts'), "import { pear } from 'pears/sub';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","exports":{"./sub":"./first.ts"}}');
  writeFileSync(join(cwd, 'packages/pears/first.ts'), 'export const pear = 1;\n');
  writeFileSync(join(cwd, 'packages/pears/second.ts'), 'export const pear = 2;\n');
  const command = `knip --no-progress --files --cache --cache-location ${cacheLocation}`;

  try {
    const cold = exec(command, { cwd });
    assert.equal(cold.stdout, 'Unused files (1)\npackages/pears/second.ts');

    writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","exports":{"./sub":"./second.ts"}}');

    const warm = exec(command, { cwd });
    assert.equal(warm.stdout, 'Unused files (1)\npackages/pears/first.ts');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});

test('Cached files are re-analyzed when a linked workspace package changes its main', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-main-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  mkdirSync(join(cwd, 'packages/apples'), { recursive: true });
  mkdirSync(join(cwd, 'packages/pears'), { recursive: true });
  mkdirSync(join(cwd, 'node_modules'));
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","workspaces":["packages/*"]}');
  writeFileSync(join(cwd, 'packages/apples/package.json'), '{"name":"apples","dependencies":{"pears":"*"}}');
  writeFileSync(join(cwd, 'packages/apples/index.ts'), "import { pear } from 'pears';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","main":"first.ts"}');
  writeFileSync(join(cwd, 'packages/pears/first.ts'), 'export const pear = 1;\n');
  writeFileSync(join(cwd, 'packages/pears/second.ts'), 'export const pear = 2;\n');
  symlinkSync(join(cwd, 'packages/pears'), join(cwd, 'node_modules/pears'));
  const command = `knip --no-progress --files --cache --cache-location ${cacheLocation}`;

  try {
    const cold = exec(command, { cwd });
    assert.equal(cold.stdout, 'Unused files (1)\npackages/pears/second.ts');

    writeFileSync(join(cwd, 'packages/pears/package.json'), '{"name":"pears","main":"second.ts"}');

    const warm = exec(command, { cwd });
    assert.equal(warm.stdout, 'Unused files (1)\npackages/pears/first.ts');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
