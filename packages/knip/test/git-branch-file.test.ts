import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/git-branch-file');
const gitLogsDir = resolve('fixtures/git-branch-file/.git/logs/refs/heads/don');

test('Ignore files in .git directory (branch names ending in .ts)', async () => {
  mkdirSync(gitLogsDir, { recursive: true });
  writeFileSync(resolve('fixtures/git-branch-file/.git/logs/refs/heads/don/feature.ts'), '');

  try {
    const options = await createOptions({ cwd });
    const { issues } = await main(options);

    assert.equal(issues.files.size, 0);
  } finally {
    rmSync(resolve('fixtures/git-branch-file/.git'), { recursive: true, force: true });
  }
});
