import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore');

test('Obey gitignore', async () => {
  const options = await createOptions({ cwd, gitignore: true });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['packages/a/routes/page.ts']);
});

test('Obey gitignore (directory with trailing slash)', async () => {
  const options = await createOptions({ cwd: `${cwd}/`, gitignore: true });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['packages/a/routes/page.ts']);
});
