import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-resolution-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () => main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } }));
  const cleanup = () => {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  };
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  return { cwd, run, cleanup };
};

test('Cached file is re-analyzed when an unresolved import target is added', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { banana } from './banana';\nconsole.log(banana);\n");

  try {
    assert.equal((await run()).counters.unresolved, 1);

    writeFileSync(join(cwd, 'banana.ts'), 'export const banana = 1;\n');

    const { counters } = await run();
    assert.equal(counters.unresolved, 0);
    assert.equal(counters.files, 0);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when an imported file is deleted', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { apple } from './apple';\nconsole.log(apple);\n");
  writeFileSync(join(cwd, 'apple.ts'), 'export const apple = 1;\n');

  try {
    assert.equal((await run()).counters.unresolved, 0);

    unlinkSync(join(cwd, 'apple.ts'));

    assert.equal((await run()).counters.unresolved, 1);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when an import target moves to an index file', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { pear } from './pear';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'pear.ts'), 'export const pear = 1;\n');

  try {
    assert.equal((await run()).counters.files, 0);

    unlinkSync(join(cwd, 'pear.ts'));
    mkdirSync(join(cwd, 'pear'));
    writeFileSync(join(cwd, 'pear/index.ts'), 'export const pear = 1;\n');

    const { counters } = await run();
    assert.equal(counters.unresolved, 0);
    assert.equal(counters.files, 0);
  } finally {
    cleanup();
  }
});

test('Cached files are re-analyzed when tsconfig paths change', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { util } from '@/util';\nconsole.log(util);\n");
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'src/util.ts'), 'export const util = 1;\n');
  writeFileSync(join(cwd, 'tsconfig.json'), '{"compilerOptions":{}}');

  try {
    const cold = await run();
    assert.equal(cold.counters.unresolved, 1);
    assert.equal(cold.counters.files, 1);

    writeFileSync(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}');

    const warm = await run();
    assert.equal(warm.counters.unresolved, 0);
    assert.equal(warm.counters.files, 0);

    writeFileSync(join(cwd, 'tsconfig.json'), '{"compilerOptions":{}}');

    const reverted = await run();
    assert.equal(reverted.counters.unresolved, 1);
    assert.equal(reverted.counters.files, 1);
  } finally {
    cleanup();
  }
});

test('Cached files are re-analyzed when knip.json paths change', async () => {
  const { cwd, run, cleanup } = setup();
  writeFileSync(join(cwd, 'index.ts'), "import { util } from '~/util';\nconsole.log(util);\n");
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'src/util.ts'), 'export const util = 1;\n');
  writeFileSync(join(cwd, 'knip.json'), '{}');

  try {
    const cold = await run();
    assert.equal(cold.counters.unresolved, 1);
    assert.equal(cold.counters.files, 1);

    writeFileSync(join(cwd, 'knip.json'), '{"paths":{"~/*":["src/*"]}}');

    const warm = await run();
    assert.equal(warm.counters.unresolved, 0);
    assert.equal(warm.counters.files, 0);
  } finally {
    cleanup();
  }
});

test('Cached files are re-analyzed when a nested tsconfig changes its paths', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'src/lib'), { recursive: true });
  writeFileSync(join(cwd, 'knip.json'), '{"entry":["src/app.ts"]}');
  writeFileSync(join(cwd, 'tsconfig.json'), '{"compilerOptions":{}}');
  writeFileSync(join(cwd, 'src/tsconfig.json'), '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["lib/*"]}}}');
  writeFileSync(join(cwd, 'src/app.ts'), "import { x } from '@/x';\nconsole.log(x);\n");
  writeFileSync(join(cwd, 'src/lib/x.ts'), 'export const x = 1;\n');

  try {
    assert.equal((await run()).counters.unresolved, 0);

    writeFileSync(join(cwd, 'src/tsconfig.json'), '{"compilerOptions":{"baseUrl":"."}}');

    const { counters } = await run();
    assert.equal(counters.unresolved, 1);
    assert.equal(counters.files, 1);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when a file shadows a directory index behind a path alias', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'src/utils'), { recursive: true });
  writeFileSync(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}');
  writeFileSync(join(cwd, 'index.ts'), "import { util } from '@/utils';\nconsole.log(util);\n");
  writeFileSync(join(cwd, 'src/utils/index.ts'), 'export const util = 1;\n');

  try {
    assert.equal((await run()).counters.files, 0);

    writeFileSync(join(cwd, 'src/utils.ts'), 'export const util = 2;\n');

    const { counters, issues } = await run();
    assert.equal(counters.files, 1);
    assert.deepEqual(Object.keys(issues.files), ['src/utils/index.ts']);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when an installed dependency is removed', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'node_modules/host'), { recursive: true });
  mkdirSync(join(cwd, 'node_modules/peer'), { recursive: true });
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","dependencies":{"host":"1.0.0"}}');
  writeFileSync(
    join(cwd, 'node_modules/host/package.json'),
    '{"name":"host","main":"index.js","peerDependencies":{"peer":"*"}}'
  );
  writeFileSync(join(cwd, 'node_modules/host/index.js'), 'module.exports = {};\n');
  writeFileSync(join(cwd, 'node_modules/peer/package.json'), '{"name":"peer","main":"index.js"}');
  writeFileSync(join(cwd, 'node_modules/peer/index.js'), 'module.exports = {};\n');
  writeFileSync(join(cwd, 'index.ts'), "import 'host';\nimport 'peer';\n");

  try {
    assert.equal((await run()).counters.unlisted, 0);

    rmSync(join(cwd, 'node_modules/peer'), { recursive: true });

    const { counters, issues } = await run();
    assert.equal(counters.unlisted, 1);
    assert.deepEqual(Object.keys(issues.unlisted['index.ts']), ['peer']);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when a linked dependency is removed', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'vendor/lib'), { recursive: true });
  mkdirSync(join(cwd, 'node_modules'));
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard","dependencies":{"lib":"file:./vendor/lib"}}');
  writeFileSync(join(cwd, '.gitignore'), 'vendor\n');
  writeFileSync(join(cwd, 'vendor/lib/package.json'), '{"name":"lib","main":"index.ts"}');
  writeFileSync(join(cwd, 'vendor/lib/index.ts'), 'export const lib = 1;\n');
  symlinkSync(join(cwd, 'vendor/lib'), join(cwd, 'node_modules/lib'));
  writeFileSync(join(cwd, 'index.ts'), "import { lib } from 'lib';\nconsole.log(lib);\n");

  try {
    assert.equal((await run()).counters.unlisted, 0);

    unlinkSync(join(cwd, 'node_modules/lib'));
    writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');

    const { counters, issues } = await run();
    assert.equal(counters.unlisted, 1);
    assert.deepEqual(Object.keys(issues.unlisted['index.ts']), ['lib']);
  } finally {
    cleanup();
  }
});

test('Cached file is re-analyzed when an imported directory is deleted', async () => {
  const { cwd, run, cleanup } = setup();
  mkdirSync(join(cwd, 'pear'));
  writeFileSync(join(cwd, 'index.ts'), "import { pear } from './pear';\nconsole.log(pear);\n");
  writeFileSync(join(cwd, 'pear/index.ts'), 'export const pear = 1;\n');

  try {
    assert.equal((await run()).counters.unresolved, 0);

    rmSync(join(cwd, 'pear'), { recursive: true });

    assert.equal((await run()).counters.unresolved, 1);
  } finally {
    cleanup();
  }
});
