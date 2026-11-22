import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore-star-negation');

// A `dir/*` ignore also hides nested files (git ignores the contents of ignored dirs); an
// unrelated negation must not expose them. Counterpart to the shallow `/*` in CODEOWNERS.
test('A dir/* gitignore ignores nested files despite an unrelated negation', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  // generated/other/deep.ts stays ignored; generated/keep/kept.ts is un-ignored and unused;
  // generated/* is anchored to the root, so src/generated/types.ts is analyzed and unused
  assert.deepEqual(Object.keys(issues.files).sort(), ['generated/keep/kept.ts', 'src/generated/types.ts']);
});
