import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/cache-glob-unignored');

test('Cached globs pick up files in a directory that is no longer gitignored', () => {
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const fixtureCopy = mkdtempSync(join(tmpdir(), 'knip-fixture-'));
  cpSync(cwd, fixtureCopy, { recursive: true });
  const gitignore = join(fixtureCopy, '.gitignore');

  try {
    const command = `knip --no-progress --files --cache --cache-location ${cacheLocation}`;

    writeFileSync(gitignore, 'generated\n');
    const cold = exec(command, { cwd: fixtureCopy });
    assert.equal(cold.stdout, '');
    assert.equal(cold.status, 0);

    writeFileSync(gitignore, '\n');
    const warm = exec(command, { cwd: fixtureCopy });
    assert.match(warm.stdout, /generated\/pear\.ts/);
    assert.equal(warm.status, 1);
  } finally {
    rmSync(cacheLocation, { recursive: true, force: true });
    rmSync(fixtureCopy, { recursive: true, force: true });
  }
});
