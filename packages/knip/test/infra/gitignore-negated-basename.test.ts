import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore-negated-basename');

test('Gitignore negations un-ignore only the paths they match', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['lib/dist/helper.ts', 'src/draft.ts']);
});
