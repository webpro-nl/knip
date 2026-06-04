import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/load-error');

test('Plugin config that throws on load should not be fatal', async () => {
  const options = await createOptions({ cwd });
  await assert.doesNotReject(main(options));
  const { counters } = await main(options);
  assert.equal(counters.processed, 2);
});

test('Plugin config that throws on load exits non-zero via CLI', () => {
  const result = exec('knip --no-progress', { cwd });
  assert.match(result.stderr, /^ERROR: Error loading vite\.config\.ts /m);
  assert.equal(result.status, 1);
});

test('Plugin config that throws on load exits zero with --no-exit-code', () => {
  const result = exec('knip --no-progress --no-exit-code', { cwd });
  assert.match(result.stderr, /^ERROR: Error loading vite\.config\.ts /m);
  assert.equal(result.status, 0);
});

test('Plugin config load errors are not cached, and recovery is cached', () => {
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const fixtureCopy = mkdtempSync(join(tmpdir(), 'knip-fixture-'));
  cpSync(cwd, fixtureCopy, { recursive: true });

  try {
    const command = `knip --no-progress --cache --cache-location ${cacheLocation}`;

    const cold = exec(command, { cwd: fixtureCopy });
    const warm = exec(command, { cwd: fixtureCopy });
    assert.match(cold.stderr, /^ERROR: Error loading vite\.config\.ts /m);
    assert.match(warm.stderr, /^ERROR: Error loading vite\.config\.ts /m);
    assert.equal(cold.status, 1);
    assert.equal(warm.status, 1);

    writeFileSync(join(fixtureCopy, 'missing-bootstrap-output.js'), "process.stderr.write('bootstrap-loaded\\n');\n");

    const recovered = exec(command, { cwd: fixtureCopy });
    assert.match(recovered.stderr, /bootstrap-loaded/);
    assert.doesNotMatch(recovered.stderr, /^ERROR: Error loading/m);

    const cached = exec(command, { cwd: fixtureCopy });
    assert.doesNotMatch(cached.stderr, /bootstrap-loaded/);
    assert.doesNotMatch(cached.stderr, /^ERROR: Error loading/m);
  } finally {
    rmSync(cacheLocation, { recursive: true, force: true });
    rmSync(fixtureCopy, { recursive: true, force: true });
  }
});
