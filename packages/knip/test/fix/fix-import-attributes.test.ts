import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix re-exports with import attributes', async () => {
  const cwd = await copyFixture('fixtures/fix-import-attributes');
  const options = await createOptions({ cwd, isFix: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['barrel.mjs']['settings'].isFixed);

  assert.equal(
    await readFile(join(cwd, 'barrel.mjs'), 'utf8'),
    `;
export const version = 1;
`
  );

  assert.equal(counters.exports, 0);
});
