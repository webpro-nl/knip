import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/sveltekit-monorepo');

test('Resolve SvelteKit ./$types in a monorepo despite an ancestor tsconfig (#1778)', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.deepEqual(issues.unresolved, {});
});
