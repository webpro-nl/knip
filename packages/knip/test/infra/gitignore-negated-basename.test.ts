import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore-negated-basename');

test('Unrelated gitignore negation does not un-ignore a sibling path', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['lib/dist/helper.ts']);
});
