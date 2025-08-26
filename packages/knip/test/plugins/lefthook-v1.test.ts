import { test } from 'bun:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const skipIfBun = typeof Bun !== 'undefined' && os.platform() === 'win32' ? test.skip : test;

const cwd = resolve('fixtures/plugins/lefthook-v1');

skipIfBun('Find dependencies with the lefthook v1 plugin', async () => {
  const CI = process.env.CI;
  process.env.CI = '';
  await fs.rename(join(cwd, '_git'), join(cwd, '.git')); // Can't add .git folder to repo

  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });

  process.env.CI = CI;
  await fs.rename(join(cwd, '.git'), join(cwd, '_git'));
});
