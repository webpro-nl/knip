import { afterAll, beforeAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const skipIfBun = typeof Bun !== 'undefined' && os.platform() === 'win32' ? () => {} : (fn: () => void) => fn();

const originalCwd = process.cwd();
const folderMain = resolve('fixtures/plugins/lefthook-v1');
const folderWorktree = resolve('fixtures/plugins/lefthook-v1-worktree-branch-checkout');

const CI = process.env.CI;

skipIfBun(() =>
  beforeAll(async () => {
    process.env.CI = '';
    // Can't add .git folder to repo
    for (const folder of [folderMain, folderWorktree]) {
      await fs.cp(join(folder, '_git'), join(folder, '.git'), {
        recursive: true,
        force: true,
      });
    }
  })
);

skipIfBun(() =>
  test('Find dependencies with the lefthook v1 plugin', async () => {
    process.chdir(folderMain);
    const { main } = await import('../../src/index.js');
    const { counters } = await main({
      ...baseArguments,
      cwd: folderMain,
    });

    assert.deepEqual(counters, {
      ...baseCounters,
      processed: 0,
      total: 0,
    });
  })
);

skipIfBun(() =>
  test('Find dependencies with the lefthook v1 in a worktreee branch checkout', async () => {
    process.chdir(folderWorktree);
    const { main } = await import('../../src/index.js');
    const { counters } = await main({
      ...baseArguments,
      cwd: folderWorktree,
    });

    assert.deepEqual(counters, {
      ...baseCounters,
      processed: 0,
      total: 0,
    });
  })
);

skipIfBun(() =>
  afterAll(async () => {
    process.env.CI = CI;
    process.chdir(originalCwd);
    for (const folder of [folderMain, folderWorktree]) {
      await fs.rm(join(folder, '.git'), { recursive: true, force: true });
    }
  })
);
