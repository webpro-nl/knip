import assert from 'node:assert/strict';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { deserialize } from 'node:v8';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

for (const [value, message] of [
  ['"Missing environment"', 'Missing environment'],
  ['undefined', 'undefined'],
  ['null', 'null'],
  ['new Error("Missing environment")', 'Missing environment'],
]) {
  for (const isAsync of [false, true]) {
    const functionSource = `${isAsync ? 'async ' : ''}() => { throw ${value}; }`;

    test(`Optional config failure retains AST entries (${value}, async: ${isAsync})`, async () => {
      const cwd = await copyFixture('fixtures/plugins/next-page-extensions');
      try {
        const configPath = join(cwd, 'next.config.js');
        const config = await readFile(configPath, 'utf8');
        await writeFile(configPath, `${config}\nmodule.exports = ${functionSource};\n`);

        const result = exec('knip --no-progress --reporter json --include files', { cwd });
        assert.equal(result.stderr, '');
        assert.equal(result.status, 1);
        assert.deepEqual(JSON.parse(result.stdout), {
          issues: [{ file: 'src/unused.ts', files: [{ name: 'src/unused.ts' }] }],
        });
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    });

    test(`Required config failure reports its cause (${value}, async: ${isAsync})`, async () => {
      const cwd = await copyFixture('fixtures/plugin-config/resolve-config-error');
      try {
        await writeFile(join(cwd, 'vite.config.ts'), `export default ${functionSource};\n`);

        const result = exec('knip --no-progress --no-exit-code', { cwd });
        assert.equal(result.status, 2);
        assert.equal(
          result.stderr,
          `ERROR: Error loading vite.config.ts (${message})\nERROR: Please fix or visit https://knip.dev/reference/known-issues`
        );
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    });
  }
}

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const rejections = resolve('fixtures/plugin-config/floating-rejections');

const knownIssues = 'ERROR: Please fix or visit https://knip.dev/reference/known-issues';

skipIfBun('Immediate floating rejection in a config fails the run after reporting', () => {
  const result = exec('knip --no-progress --reporter json --include files --workspace packages/immediate', {
    cwd: rejections,
  });
  assert.equal(result.status, 2);
  assert.equal(
    result.stderr,
    `ERROR: Unhandled rejection, likely from packages/immediate/next.config.js (boom)\n${knownIssues}`
  );
  assert.deepEqual(JSON.parse(result.stdout), {
    issues: [{ file: 'packages/immediate/src/unused.ts', files: [{ name: 'packages/immediate/src/unused.ts' }] }],
  });
});

skipIfBun('Late floating rejection in a config fails the run after reporting', () => {
  const result = exec('knip --no-progress --no-exit-code --reporter json --include files --workspace packages/late', {
    cwd: rejections,
  });
  assert.equal(result.status, 2);
  assert.equal(
    result.stderr,
    `ERROR: Unhandled rejection, likely from packages/late/next.config.js (boom)\n${knownIssues}`
  );
  assert.deepEqual(JSON.parse(result.stdout), { issues: [] });
});

skipIfBun('Rejection through a shared service started by another config fails the run', () => {
  const result = exec('knip --no-progress --reporter json --include files', { cwd: rejections });
  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /^ERROR: Unhandled rejection, likely from packages\/service-(caller\/vite\.config\.ts|starter\/next\.config\.js) \(service boom\)$/m
  );
});

skipIfBun('Configs from a run with a floating rejection are not served from the cache on the next run', async () => {
  const cwd = await copyFixture('fixtures/plugin-config/floating-rejections');
  try {
    for (let run = 0; run < 2; run++) {
      const result = exec('knip --no-progress --cache', { cwd });
      assert.equal(result.status, 2);
      assert.match(
        result.stderr,
        /likely from packages\/service-(caller\/vite\.config\.ts|starter\/next\.config\.js) \(service boom\)/
      );
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

skipIfBun('Configs loaded after a floating rejection are not written to the cache', async () => {
  const cwd = await copyFixture('fixtures/plugin-config/floating-rejections');
  try {
    const result = exec('knip --no-progress --cache --workspace packages/later-load', { cwd });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /likely from packages\/later-load\/next\.config\.js \(boom\)/);
    const cacheDir = join(cwd, 'node_modules/.cache/knip');
    const [cacheFile] = (await readdir(cacheDir)).filter(name => name.startsWith('plugins-packages-later-load'));
    assert.deepEqual([...deserialize(await readFile(join(cacheDir, cacheFile))).keys()], []);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('Floating rejection while loading the Knip config fails the run after reporting', () => {
  const result = exec('knip --no-progress --config rejecting-knip.mjs --workspace .', { cwd: rejections });
  assert.equal(result.status, 2);
  assert.equal(result.stderr, `ERROR: Unhandled rejection (startup boom)\n${knownIssues}`);
});

test('Floating rejection outside plugin configs fails the run', () => {
  const result = exec('knip --no-progress --workspace . --reporter ./rejecting-reporter.mjs', { cwd: rejections });
  assert.equal(result.status, 2);
  assert.equal(result.stderr, `ERROR: Unhandled rejection (reporter boom)\n${knownIssues}`);
});
