import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/cache-glob-new-entry');

test('Cached globs pick up a new entry file in a directory that matched nothing before', () => {
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const fixtureCopy = mkdtempSync(join(tmpdir(), 'knip-fixture-'));
  cpSync(cwd, fixtureCopy, { recursive: true });

  try {
    const command = `knip --no-progress --files --cache --cache-location ${cacheLocation}`;

    const cold = exec(command, { cwd: fixtureCopy });
    assert.equal(cold.stdout, '');
    assert.equal(cold.status, 0);

    writeFileSync(join(fixtureCopy, 'src/orchard/apple.spec.ts'), 'export {};\n');

    const warm = exec(command, { cwd: fixtureCopy });
    assert.equal(warm.stdout, '');
    assert.equal(warm.status, 0);
  } finally {
    rmSync(cacheLocation, { recursive: true, force: true });
    rmSync(fixtureCopy, { recursive: true, force: true });
  }
});
