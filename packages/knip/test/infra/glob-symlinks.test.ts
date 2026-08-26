import assert from 'node:assert/strict';
import { lstatSync } from 'node:fs';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/glob-symlinks');

// Symlinks may be checked out as plain files (e.g. on Windows without core.symlinks)
const testIf = lstatSync(join(cwd, 'linked')).isSymbolicLink() ? test : test.skip;

testIf('Does not report symlinked paths of used files as unused files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
