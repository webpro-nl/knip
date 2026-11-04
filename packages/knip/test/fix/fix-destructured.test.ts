import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix destructured exports, but keep locally referenced bindings', async () => {
  const cwd = await copyFixture('fixtures/fix-destructured');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.exports['values.js']['a']);
  assert(issues.exports['values.js']['b']);
  assert(issues.exports['values.js']['c']);
  assert(issues.exports['values.js']['d']);

  assert.equal(
    await readFile(join(cwd, 'values.js'), 'utf8'),
    `export const { a,  } = { a: 1, b: 2 };

export const [c, ] = [3, 4];

export const read = () => a + c;
`
  );
});
