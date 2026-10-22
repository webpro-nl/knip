import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import test from 'node:test';
import { run } from '../../src/run.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/session');

skipIfBun('Watch the project directory instead of the process working directory', async t => {
  const watch = t.mock.method(fs, 'watch', () => {});
  syncBuiltinESMExports();

  try {
    await run(await createOptions({ cwd, isWatch: true }));
    assert.equal(watch.mock.calls[0]?.arguments[0], cwd);
  } finally {
    watch.mock.restore();
    syncBuiltinESMExports();
  }
});
